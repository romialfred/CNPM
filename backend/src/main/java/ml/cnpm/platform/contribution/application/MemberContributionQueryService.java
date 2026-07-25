package ml.cnpm.platform.contribution.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Projection « mes cotisations » de l'espace membre.
 *
 * <p><b>Périmètre.</b> Le service ne lit JAMAIS un identifiant d'adhésion fourni par le
 * client : il le résout depuis le compte authentifié ({@code iam.user_account.member_id}).
 * {@code CONTRIBUTION.READ} est aussi porté par des rôles d'administration, si bien qu'une
 * permission seule ne borne rien — c'est le rattachement du compte qui borne. Un compte
 * sans adhésion ne voit rien, quelle que soit son habilitation.
 *
 * <p>Lecture seule. Toutes les requêtes sont bornées (pagination obligatoire) et aucune
 * n'accepte de fragment SQL venant de l'appelant : tri et filtres sont traduits depuis un
 * jeu fermé de valeurs.
 */
@Service
public class MemberContributionQueryService {

    /** Colonnes de tri autorisées, traduites depuis le vocabulaire du client. */
    private static final List<String> SORTABLE = List.of("dueDate", "reference", "status");

    private static final String CALL_COLUMNS =
            "c.id, c.call_number, c.amount_due, c.balance_amount, c.due_date, c.currency,"
                    + " c.created_at, fy.year";

    private final JdbcTemplate jdbc;

    MemberContributionQueryService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Appels de cotisation du membre connecté.
     *
     * @param accountId compte authentifié ; son rattachement borne le périmètre
     * @param status filtre d'état dans le vocabulaire de l'écran, ou {@code null}
     * @param exercise exercice à isoler, ou {@code null}
     * @param sort {@code dueDate}, {@code reference} ou {@code status}
     * @param descending sens du tri
     */
    @PreAuthorize("hasAuthority('PERM_CONTRIBUTION.READ')")
    @Transactional(readOnly = true)
    public MemberContributionView.Page list(
            UUID accountId,
            String status,
            Integer exercise,
            String sort,
            boolean descending,
            int page,
            int size) {
        UUID membershipId = requireMembership(accountId);
        LocalDate today = LocalDate.now();

        StringBuilder where =
                new StringBuilder(" FROM contribution.contribution_call c"
                        + " JOIN contribution.fiscal_year fy ON fy.id = c.fiscal_year_id"
                        + " WHERE c.membership_id = ?");
        List<Object> arguments = new ArrayList<>();
        arguments.add(membershipId);

        if (exercise != null) {
            where.append(" AND fy.year = ?");
            arguments.add(exercise);
        }
        if (status != null && !status.isBlank()) {
            where.append(" AND ").append(statusPredicate(status));
            arguments.add(today);
        }

        Long total =
                jdbc.queryForObject("SELECT count(*)" + where, Long.class, arguments.toArray());
        long totalElements = total == null ? 0L : total;

        List<Object> pageArguments = new ArrayList<>(arguments);
        pageArguments.add(size);
        pageArguments.add(page * size);
        List<MemberContributionView.Summary> items =
                jdbc.query(
                        "SELECT " + CALL_COLUMNS + where + orderBy(sort, descending)
                                + " LIMIT ? OFFSET ?",
                        (rs, i) -> summary(rs, today),
                        pageArguments.toArray());

        List<Integer> exercises =
                jdbc.queryForList(
                        "SELECT DISTINCT fy.year FROM contribution.contribution_call c"
                                + " JOIN contribution.fiscal_year fy ON fy.id = c.fiscal_year_id"
                                + " WHERE c.membership_id = ? ORDER BY fy.year DESC",
                        Integer.class,
                        membershipId);

        int totalPages = size <= 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        return new MemberContributionView.Page(
                items, page, size, totalElements, totalPages, exercises);
    }

    /**
     * Détail d'un appel, échéancier et ajustements compris.
     *
     * @throws ResourceNotFoundException si l'appel n'existe pas OU n'appartient pas au
     *     membre connecté — les deux cas se répondent à l'identique, pour ne pas révéler
     *     l'existence de l'appel d'un autre membre
     */
    @PreAuthorize("hasAuthority('PERM_CONTRIBUTION.READ')")
    @Transactional(readOnly = true)
    public MemberContributionView.Detail detail(UUID accountId, UUID contributionId) {
        UUID membershipId = requireMembership(accountId);
        LocalDate today = LocalDate.now();

        MemberContributionView.Summary head =
                jdbc
                        .query(
                                "SELECT " + CALL_COLUMNS
                                        + " FROM contribution.contribution_call c"
                                        + " JOIN contribution.fiscal_year fy ON fy.id = c.fiscal_year_id"
                                        + " WHERE c.id = ? AND c.membership_id = ?",
                                (rs, i) -> summary(rs, today),
                                contributionId,
                                membershipId)
                        .stream()
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Cotisation introuvable."));

        String issuedOn =
                jdbc.queryForObject(
                        "SELECT to_char(created_at, 'YYYY-MM-DD') FROM contribution.contribution_call"
                                + " WHERE id = ?",
                        String.class,
                        contributionId);

        List<MemberContributionView.Installment> schedule =
                jdbc.query(
                        "SELECT id, installment_no, due_date, amount_due, amount_paid"
                                + " FROM contribution.installment WHERE contribution_call_id = ?"
                                + " ORDER BY installment_no",
                        (rs, i) -> {
                            BigDecimal expected = rs.getBigDecimal("amount_due");
                            BigDecimal paid = rs.getBigDecimal("amount_paid");
                            BigDecimal outstanding = expected.subtract(paid).max(BigDecimal.ZERO);
                            LocalDate due = rs.getObject("due_date", LocalDate.class);
                            return new MemberContributionView.Installment(
                                    rs.getString("id"),
                                    "Échéance " + rs.getInt("installment_no"),
                                    due.toString(),
                                    expected,
                                    paid,
                                    outstanding,
                                    head.currency(),
                                    derivedStatus(expected, outstanding, due, today));
                        },
                        contributionId);

        List<MemberContributionView.Adjustment> adjustments =
                jdbc.query(
                        "SELECT adjustment_number, adjustment_type, amount, reason_code,"
                                + " to_char(created_at, 'YYYY-MM-DD') AS recorded_on"
                                + " FROM contribution.adjustment WHERE contribution_call_id = ?"
                                + " ORDER BY created_at",
                        (rs, i) ->
                                new MemberContributionView.Adjustment(
                                        rs.getString("adjustment_number"),
                                        "CREDIT".equalsIgnoreCase(rs.getString("adjustment_type"))
                                                ? "CREDIT"
                                                : "DEBIT",
                                        rs.getBigDecimal("amount"),
                                        head.currency(),
                                        rs.getString("reason_code"),
                                        rs.getString("recorded_on")),
                        contributionId);

        // Note d'origine strictement factuelle : elle situe l'appel, elle n'explique pas un
        // calcul de barème que cette projection ne connaît pas.
        String note =
                "Appel %s de l’exercice %d.".formatted(head.reference(), head.exercise());

        return new MemberContributionView.Detail(
                head.id(),
                head.reference(),
                head.exercise(),
                head.dueDate(),
                head.calledAmount(),
                head.paidAmount(),
                head.outstandingAmount(),
                head.currency(),
                head.status(),
                issuedOn,
                note,
                adjustments,
                schedule);
    }

    /**
     * Adhésion du compte connecté.
     *
     * @throws ResourceNotFoundException si le compte n'est rattaché à aucune adhésion : un
     *     compte professionnel n'a pas d'espace membre, et lui répondre une page vide
     *     laisserait croire à une adhésion sans cotisation
     */
    private UUID requireMembership(UUID accountId) {
        return Optional.ofNullable(accountId)
                .flatMap(
                        id ->
                                jdbc
                                        .query(
                                                "SELECT member_id FROM iam.user_account"
                                                        + " WHERE id = ? AND member_id IS NOT NULL",
                                                (rs, i) -> rs.getObject("member_id", UUID.class),
                                                id)
                                        .stream()
                                        .findFirst())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Aucune adhésion n’est rattachée à ce compte."));
    }

    private MemberContributionView.Summary summary(java.sql.ResultSet rs, LocalDate today)
            throws java.sql.SQLException {
        BigDecimal called = rs.getBigDecimal("amount_due");
        BigDecimal outstanding = rs.getBigDecimal("balance_amount");
        LocalDate due = rs.getObject("due_date", LocalDate.class);
        return new MemberContributionView.Summary(
                rs.getString("id"),
                rs.getString("call_number"),
                rs.getInt("year"),
                due.toString(),
                called,
                called.subtract(outstanding).max(BigDecimal.ZERO),
                outstanding,
                rs.getString("currency"),
                derivedStatus(called, outstanding, due, today));
    }

    /** Voir {@link MemberContributionView.Summary} : le retard prime sur le partiel. */
    private static String derivedStatus(
            BigDecimal called, BigDecimal outstanding, LocalDate dueDate, LocalDate today) {
        if (outstanding.signum() <= 0) {
            return "REGLEE";
        }
        if (dueDate.isBefore(today)) {
            return "EN_RETARD";
        }
        return outstanding.compareTo(called) < 0 ? "PARTIELLE" : "A_ECHOIR";
    }

    /**
     * Traduit un état d'écran en prédicat SQL. Le paramètre ajouté est toujours la date du
     * jour : la forme du prédicat vient d'un jeu fermé, jamais de la chaîne reçue.
     */
    private static String statusPredicate(String status) {
        return switch (status.toUpperCase(Locale.ROOT)) {
            case "REGLEE" -> "(c.balance_amount <= 0 AND ?::date IS NOT NULL)";
            case "EN_RETARD" -> "(c.balance_amount > 0 AND c.due_date < ?)";
            case "PARTIELLE" ->
                    "(c.balance_amount > 0 AND c.balance_amount < c.amount_due AND c.due_date >= ?)";
            case "A_ECHOIR" ->
                    "(c.balance_amount > 0 AND c.balance_amount >= c.amount_due AND c.due_date >= ?)";
            default -> throw new IllegalArgumentException("État de cotisation inconnu : " + status);
        };
    }

    /** Tri borné à un jeu fermé de colonnes ; toute autre valeur retombe sur l'échéance. */
    private static String orderBy(String sort, boolean descending) {
        String column =
                switch (SORTABLE.contains(sort) ? sort : "dueDate") {
                    case "reference" -> "c.call_number";
                    case "status" -> "c.balance_amount";
                    default -> "c.due_date";
                };
        // `c.id` en second critère : sans lui, deux appels de même échéance pourraient
        // changer de page d'une requête à l'autre et disparaître de la pagination.
        return " ORDER BY " + column + (descending ? " DESC" : " ASC") + ", c.id ASC";
    }
}
