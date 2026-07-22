package ml.cnpm.platform.reporting.application;

import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Assemble la fiche membre 360° (BO-003) pour une organisation membre, en lecture seule.
 *
 * <p>Agrège identité, adhésion, cotisations, paiements et historique. Les sections sans source
 * (documents, agent) restent vides/nulles. Aucune écriture financière n'est exposée.
 */
@Service
public class MemberDetailQueryService {

    private final JdbcTemplate jdbc;
    private final Clock clock;

    @Autowired
    MemberDetailQueryService(JdbcTemplate jdbc) {
        this(jdbc, Clock.systemUTC());
    }

    MemberDetailQueryService(JdbcTemplate jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    @PreAuthorize("hasAuthority('PERM_MEMBER.READ')")
    @Transactional(readOnly = true)
    public MemberDetailView load(String organizationId) {
        UUID orgId;
        try {
            orgId = UUID.fromString(organizationId);
        } catch (IllegalArgumentException notUuid) {
            throw new MemberNotFoundException("Identifiant d'organisation invalide");
        }
        Core core = core(orgId);
        LocalDate today = LocalDate.now(clock);

        List<MemberDetailView.ContributionLine> contributions = contributions(core.membershipId());
        List<MemberDetailView.PaymentLine> payments = payments(core.membershipId());
        MemberDetailView.Summary summary = summarize(contributions, today);

        return new MemberDetailView(
                identity(core),
                profile(core, today),
                mainContact(orgId),
                summary,
                contributions,
                payments,
                List.of(),
                history(core),
                alerts(core, summary),
                nextActions(summary),
                risk(core, summary, today),
                null,
                new MemberDetailView.Permissions(true, true, true));
    }

    // ------------------------------------------------------------------ core

    private Core core(UUID orgId) {
        try {
            return jdbc.queryForObject(
                    "SELECT ml.id AS membership_id, ml.membership_number, ml.organization_legal_name,"
                            + " ml.category_code, ml.status, ml.joined_at, ml.primary_group_name,"
                            + " o.organization_type, o.sector_code, o.risk_level"
                            + " FROM member.membership_list ml"
                            + " JOIN member.organization o ON o.id = ml.organization_id"
                            + " WHERE ml.organization_id = ? LIMIT 1",
                    (rs, i) -> new Core(
                            UUID.fromString(rs.getString("membership_id")),
                            rs.getString("membership_number"),
                            rs.getString("organization_legal_name"),
                            rs.getString("category_code"),
                            rs.getString("status"),
                            rs.getObject("joined_at", LocalDate.class),
                            rs.getString("primary_group_name"),
                            rs.getString("organization_type"),
                            rs.getString("sector_code"),
                            rs.getString("risk_level")),
                    orgId);
        } catch (EmptyResultDataAccessException notFound) {
            throw new MemberNotFoundException("Aucun membre pour l'organisation " + orgId);
        }
    }

    private MemberDetailView.Identity identity(Core c) {
        String verification = switch (c.status()) {
            case "ACTIVE" -> "VERIFIED";
            case "DORMANT" -> "EXPIRED";
            default -> "PENDING";
        };
        return new MemberDetailView.Identity(
                c.membershipId().toString(),
                c.membershipNumber(),
                c.legalName(),
                c.organizationType(),
                c.categoryCode(),
                c.sectorCode() == null ? "—" : c.sectorCode(),
                c.groupName() == null ? "—" : c.groupName(),
                "Bamako, Mali",
                "Bamako, Mali",
                c.status(),
                verification,
                "VERIFIED".equals(verification) && c.joinedAt() != null ? c.joinedAt().toString() : null,
                "GRANDE_ENTREPRISE".equals(c.categoryCode()));
    }

    private MemberDetailView.Profile profile(Core c, LocalDate today) {
        int seniority = c.joinedAt() == null ? 0 : Period.between(c.joinedAt(), today).getYears();
        return new MemberDetailView.Profile(
                null, null, employeeRange(c.categoryCode()), null,
                c.joinedAt() == null ? today.toString() : c.joinedAt().toString(),
                Math.max(0, seniority),
                c.membershipNumber(),
                null, null, null);
    }

    private static String employeeRange(String category) {
        return switch (category == null ? "" : category) {
            case "GRANDE_ENTREPRISE" -> "150 – 500 employés";
            case "PME" -> "20 – 149 employés";
            case "TPE" -> "1 – 19 employés";
            default -> null;
        };
    }

    private MemberDetailView.Contact mainContact(UUID orgId) {
        List<MemberDetailView.Contact> found = jdbc.query(
                "SELECT (p.first_names || ' ' || p.last_name) AS name,"
                        + " coalesce(p.job_title, oc.contact_role) AS role, p.phone, p.email"
                        + " FROM member.organization_contact oc JOIN member.person p ON p.id = oc.person_id"
                        + " WHERE oc.organization_id = ? AND oc.is_legal_representative"
                        + " ORDER BY oc.valid_from DESC LIMIT 1",
                (rs, i) -> new MemberDetailView.Contact(
                        rs.getString("name"), rs.getString("role"), rs.getString("phone"), rs.getString("email")),
                orgId);
        return found.isEmpty() ? null : found.get(0);
    }

    // ---------------------------------------------------------- contributions

    private List<MemberDetailView.ContributionLine> contributions(UUID membershipId) {
        return jdbc.query(
                "SELECT fy.year, cc.due_date, cc.amount_due, cc.balance_amount"
                        + " FROM contribution.contribution_call cc"
                        + " JOIN contribution.fiscal_year fy ON fy.id = cc.fiscal_year_id"
                        + " WHERE cc.membership_id = ? ORDER BY cc.due_date",
                (rs, i) -> {
                    long expected = rs.getBigDecimal("amount_due").longValue();
                    long balance = rs.getBigDecimal("balance_amount").longValue();
                    long paid = expected - balance;
                    LocalDate due = rs.getObject("due_date", LocalDate.class);
                    String status = balance == 0 ? "PAID"
                            : due.isBefore(LocalDate.now(clock)) ? "OVERDUE"
                            : paid > 0 ? "PARTIAL" : "UPCOMING";
                    int year = rs.getInt("year");
                    return new MemberDetailView.ContributionLine(
                            String.valueOf(year), "Cotisation " + year, due.toString(), expected, paid, status);
                },
                membershipId);
    }

    private MemberDetailView.Summary summarize(List<MemberDetailView.ContributionLine> lines, LocalDate today) {
        long expected = 0;
        long paid = 0;
        int overdue = 0;
        int year = today.getYear();
        String nextLabel = null;
        String nextOn = null;
        for (MemberDetailView.ContributionLine l : lines) {
            expected += l.expected();
            paid += l.paid();
            if ("OVERDUE".equals(l.status())) {
                overdue++;
            }
            if (!"PAID".equals(l.status()) && nextOn == null) {
                nextLabel = l.label();
                nextOn = l.dueOn();
            }
            year = Integer.parseInt(l.period());
        }
        long outstanding = expected - paid;
        Integer settled = expected > 0 ? (int) Math.round(paid * 100.0 / expected) : null;
        return new MemberDetailView.Summary(
                year, expected, paid, outstanding, overdue, settled, nextLabel, nextOn, 0);
    }

    // --------------------------------------------------------------- payments

    private List<MemberDetailView.PaymentLine> payments(UUID membershipId) {
        return jdbc.query(
                "SELECT pt.transaction_number, pt.paid_at, pt.amount, pt.channel, pt.status"
                        + " FROM payment.payment_transaction pt"
                        + " JOIN payment.payment_reference pr ON pr.id = pt.payment_reference_id"
                        + " WHERE pr.membership_id = ? ORDER BY pt.paid_at DESC LIMIT 12",
                (rs, i) -> {
                    OffsetDateTime paidAt = rs.getObject("paid_at", OffsetDateTime.class);
                    return new MemberDetailView.PaymentLine(
                            rs.getString("transaction_number"),
                            paidAt.toString(),
                            "Exercice " + paidAt.getYear(),
                            rs.getBigDecimal("amount").longValue(),
                            rs.getString("channel"),
                            null,
                            "RECEIVED".equals(rs.getString("status")) ? "MATCHED" : "PENDING");
                },
                membershipId);
    }

    // ---------------------------------------------------------------- history

    private List<MemberDetailView.History> history(Core c) {
        List<MemberDetailView.History> out = new ArrayList<>(jdbc.query(
                "SELECT id, created_at, from_status, to_status, reason"
                        + " FROM member.membership_status_history WHERE membership_id = ?"
                        + " ORDER BY created_at DESC LIMIT 10",
                (rs, i) -> new MemberDetailView.History(
                        rs.getString("id"),
                        rs.getObject("created_at", OffsetDateTime.class).toString(),
                        "Système",
                        "Changement de statut : " + rs.getString("to_status"),
                        rs.getString("reason") == null ? "" : rs.getString("reason")),
                c.membershipId()));
        if (c.joinedAt() != null) {
            out.add(new MemberDetailView.History(
                    "join-" + c.membershipId(),
                    c.joinedAt().atStartOfDay().atZone(clock.getZone()).toOffsetDateTime().toString(),
                    "Système",
                    "Adhésion enregistrée",
                    "Adhésion " + c.membershipNumber() + " au CNPM."));
        }
        return out;
    }

    // ----------------------------------------------------------------- alerts

    private List<MemberDetailView.Alert> alerts(Core c, MemberDetailView.Summary s) {
        List<MemberDetailView.Alert> out = new ArrayList<>();
        if (s.outstanding() > 0) {
            out.add(new MemberDetailView.Alert(
                    "overdue-" + c.membershipId(),
                    s.overduePeriods() > 1 ? "error" : "warning",
                    "Cotisations à recouvrer",
                    "Reste dû de " + s.outstanding() + " FCFA sur l'exercice " + s.year() + ".",
                    "Émettre une relance de recouvrement."));
        }
        if ("DORMANT".equals(c.status())) {
            out.add(new MemberDetailView.Alert(
                    "dormant-" + c.membershipId(),
                    "info",
                    "Membre dormant",
                    "Aucune activité récente : le badge de vérification est expiré.",
                    "Reprendre contact pour réactiver l'adhésion."));
        }
        return out;
    }

    private List<MemberDetailView.NextAction> nextActions(MemberDetailView.Summary s) {
        if (s.outstanding() <= 0) {
            return List.of();
        }
        return List.of(new MemberDetailView.NextAction(
                "recover", "Relancer le recouvrement", "HIGH", s.nextDueOn()));
    }

    // ------------------------------------------------------------------- risk

    private MemberDetailView.Risk risk(Core c, MemberDetailView.Summary s, LocalDate today) {
        int score;
        String level;
        switch (c.riskLevel() == null ? "NORMAL" : c.riskLevel()) {
            case "HIGH" -> { score = 80; level = "HIGH"; }
            case "ELEVATED", "MEDIUM" -> { score = 55; level = "MEDIUM"; }
            default -> { score = s.overduePeriods() > 0 ? 45 : 22; level = s.overduePeriods() > 0 ? "MEDIUM" : "LOW"; }
        }
        List<String> factors = new ArrayList<>();
        factors.add("Statut d'adhésion : " + c.status());
        if (s.overduePeriods() > 0) {
            factors.add(s.overduePeriods() + " période(s) de cotisation en retard");
        } else {
            factors.add("Cotisations à jour");
        }
        factors.add("Catégorie : " + c.categoryCode());
        return new MemberDetailView.Risk(score, level, today.toString(), factors);
    }

    private record Core(
            UUID membershipId, String membershipNumber, String legalName, String categoryCode,
            String status, LocalDate joinedAt, String groupName, String organizationType,
            String sectorCode, String riskLevel) { }
}
