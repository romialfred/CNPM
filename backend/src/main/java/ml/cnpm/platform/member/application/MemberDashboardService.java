package ml.cnpm.platform.member.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tableau de bord de l'espace membre — projection de lecture de l'adhésion du compte connecté.
 *
 * <p><b>Périmètre.</b> Aucun identifiant d'adhésion n'est accepté du client : il est résolu depuis
 * le compte authentifié ({@code iam.user_account.member_id}). Un compte sans adhésion — un compte
 * professionnel — n'a pas de tableau de bord membre et se voit refusé.
 *
 * <p><b>Frontières.</b> Read-model transverse au portail : il ne référence AUCUN type d'un autre
 * module (uniquement du SQL de lecture borné au périmètre du membre), si bien qu'aucune dépendance
 * Java inter-modules n'est introduite. {@code CONTRIBUTION.READ} est aussi porté par des rôles
 * d'administration ; ce n'est pas la permission qui borne, c'est le rattachement du compte.
 */
@Service
public class MemberDashboardService {

    private final JdbcTemplate jdbc;

    MemberDashboardService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @PreAuthorize("hasAuthority('PERM_CONTRIBUTION.READ')")
    @Transactional(readOnly = true)
    public MemberDashboardView.Dashboard dashboard(UUID accountId) {
        UUID membershipId = requireMembership(accountId);
        LocalDate today = LocalDate.now();

        MemberDashboardView.Identity identity =
                jdbc
                        .query(
                                "SELECT COALESCE(o.trade_name, o.legal_name) AS organization,"
                                        + " m.membership_number, m.category_code, m.status,"
                                        + " to_char(m.joined_at, 'YYYY-MM-DD') AS joined_at"
                                        + " FROM member.membership m"
                                        + " JOIN member.organization o ON o.id = m.organization_id"
                                        + " WHERE m.id = ?",
                                (rs, i) ->
                                        new MemberDashboardView.Identity(
                                                rs.getString("organization"),
                                                rs.getString("membership_number"),
                                                rs.getString("category_code"),
                                                normalizeStatus(rs.getString("status")),
                                                rs.getString("joined_at")),
                                membershipId)
                        .stream()
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Adhésion introuvable."));

        // Situation de cotisation par exercice : called = appelé, settled = appelé - solde,
        // outstanding = solde restant. Les totaux se déduisent des mêmes lignes.
        List<MemberDashboardView.ExerciseSummary> exercises =
                jdbc.query(
                        "SELECT fy.year,"
                                + " COALESCE(SUM(c.amount_due), 0) AS called,"
                                + " COALESCE(SUM(c.amount_due - c.balance_amount), 0) AS settled,"
                                + " COALESCE(SUM(GREATEST(c.balance_amount, 0)), 0) AS outstanding"
                                + " FROM contribution.contribution_call c"
                                + " JOIN contribution.fiscal_year fy ON fy.id = c.fiscal_year_id"
                                + " WHERE c.membership_id = ?"
                                + " GROUP BY fy.year ORDER BY fy.year DESC",
                        (rs, i) ->
                                new MemberDashboardView.ExerciseSummary(
                                        rs.getInt("year"),
                                        rs.getBigDecimal("called"),
                                        rs.getBigDecimal("settled"),
                                        rs.getBigDecimal("outstanding")),
                        membershipId);

        BigDecimal calledTotal = exercises.stream()
                .map(MemberDashboardView.ExerciseSummary::called)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal settledTotal = exercises.stream()
                .map(MemberDashboardView.ExerciseSummary::settled)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal outstandingTotal = exercises.stream()
                .map(MemberDashboardView.ExerciseSummary::outstanding)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal overdueAmount =
                jdbc.queryForObject(
                        "SELECT COALESCE(SUM(GREATEST(balance_amount, 0)), 0)"
                                + " FROM contribution.contribution_call"
                                + " WHERE membership_id = ? AND balance_amount > 0 AND due_date < ?",
                        BigDecimal.class,
                        membershipId,
                        today);

        // MIN(...) renvoie toujours une ligne, éventuellement NULL quand plus aucune échéance
        // future ne reste due : queryForObject restitue alors null sans lever d'exception.
        String nextDueDate =
                jdbc.queryForObject(
                        "SELECT to_char(MIN(due_date), 'YYYY-MM-DD')"
                                + " FROM contribution.contribution_call"
                                + " WHERE membership_id = ? AND balance_amount > 0"
                                + "   AND due_date >= ?",
                        String.class,
                        membershipId,
                        today);

        MemberDashboardView.LastPayment lastPayment =
                jdbc.query(
                                "SELECT pt.amount, pt.currency, pt.paid_at"
                                        + " FROM payment.payment_transaction pt"
                                        + " JOIN payment.payment_reference pr"
                                        + "   ON pr.id = pt.payment_reference_id"
                                        + " WHERE pr.membership_id = ?"
                                        + " ORDER BY pt.paid_at DESC LIMIT 1",
                                (rs, i) -> {
                                    java.time.OffsetDateTime paidAt =
                                            rs.getObject("paid_at", java.time.OffsetDateTime.class);
                                    return new MemberDashboardView.LastPayment(
                                            rs.getBigDecimal("amount"),
                                            rs.getString("currency"),
                                            paidAt == null ? null : paidAt.toString());
                                },
                                membershipId)
                        .stream()
                        .findFirst()
                        .orElse(null);

        int paymentCount =
                orZero(
                        jdbc.queryForObject(
                                "SELECT count(*) FROM payment.payment_transaction pt"
                                        + " JOIN payment.payment_reference pr"
                                        + "   ON pr.id = pt.payment_reference_id"
                                        + " WHERE pr.membership_id = ?",
                                Integer.class,
                                membershipId));

        int receiptCount =
                orZero(
                        jdbc.queryForObject(
                                "SELECT count(*) FROM receipt.receipt r"
                                        + " JOIN payment.payment_transaction pt"
                                        + "   ON pt.id = r.payment_transaction_id"
                                        + " JOIN payment.payment_reference pr"
                                        + "   ON pr.id = pt.payment_reference_id"
                                        + " WHERE pr.membership_id = ? AND r.status = 'ISSUED'",
                                Integer.class,
                                membershipId));

        return new MemberDashboardView.Dashboard(
                identity,
                calledTotal,
                settledTotal,
                outstandingTotal,
                overdueAmount == null ? BigDecimal.ZERO : overdueAmount,
                nextDueDate,
                lastPayment,
                paymentCount,
                receiptCount,
                exercises);
    }

    /** Statut d'adhésion normalisé pour l'affichage membre : ACTIVE, SUSPENDED, ou DORMANT. */
    private static String normalizeStatus(String status) {
        if (status == null) {
            return "DORMANT";
        }
        return switch (status.toUpperCase(java.util.Locale.ROOT)) {
            case "ACTIVE" -> "ACTIVE";
            case "SUSPENDED" -> "SUSPENDED";
            default -> "DORMANT";
        };
    }

    private static int orZero(Integer value) {
        return value == null ? 0 : value;
    }

    /** Adhésion du compte connecté, ou refus si le compte n'en porte aucune. */
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
}
