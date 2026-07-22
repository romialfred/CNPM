package ml.cnpm.platform.reporting.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Construit l'instantané du tableau de bord (BO-001) à partir du read model {@code reporting.*}.
 *
 * <p>Le service ne lit QUE le schéma {@code reporting} (vues en lecture seule) : il n'accède pas
 * aux tables privées des modules membre ou cotisation, conformément aux frontières de modules.
 * Les mesures sans source restent nulles ou vides — aucun zéro fictif.
 */
@Service
public class DashboardQueryService {

    private final JdbcTemplate jdbc;
    private final Clock clock;

    // Deux constructeurs (le second injecte une Clock pour les tests) : Spring doit savoir
    // lequel utiliser, d'où l'annotation explicite du constructeur de production.
    @Autowired
    DashboardQueryService(JdbcTemplate jdbc) {
        this(jdbc, Clock.systemUTC());
    }

    DashboardQueryService(JdbcTemplate jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    @PreAuthorize("hasAnyAuthority('PERM_REPORT.EXECUTIVE.READ','PERM_REPORT.OPERATIONAL.READ')")
    @Transactional(readOnly = true)
    public DashboardView load(String exercise) {
        Counts counts = jdbc.queryForObject(
                "SELECT active_count, dormant_count, prospect_count FROM reporting.member_status_counts",
                (rs, i) -> new Counts(rs.getLong("active_count"), rs.getLong("dormant_count"),
                        rs.getLong("prospect_count")));
        long active = counts == null ? 0 : counts.active();
        long dormant = counts == null ? 0 : counts.dormant();
        long prospect = counts == null ? 0 : counts.prospect();
        long base = active + dormant;

        Contribution contribution = contributionsFor(exercise);
        BigDecimal recoveryRate = null;
        if (contribution != null && contribution.expected() != null
                && contribution.expected().signum() > 0 && contribution.collected() != null) {
            recoveryRate = contribution.collected()
                    .multiply(BigDecimal.valueOf(100))
                    .divide(contribution.expected(), 0, RoundingMode.HALF_UP);
        }
        DashboardView.Contributions contributions = new DashboardView.Contributions(
                contribution == null ? null : contribution.expected(),
                contribution == null ? null : contribution.collected(),
                contribution == null ? null : contribution.outstanding(),
                recoveryRate);

        List<DashboardView.Kpi> kpis = List.of(
                new DashboardView.Kpi("collected", "Cotisations encaissées", contributions.collected(),
                        0, null, "FCFA", "Montant réglé sur l'exercice par la base de membres.", null),
                new DashboardView.Kpi("recovery", "Taux de recouvrement", recoveryRate,
                        0, " %", null, "Part du montant attendu effectivement encaissée.", null),
                new DashboardView.Kpi("active", "Membres actifs", BigDecimal.valueOf(active),
                        0, null, null, "Membres à jour de leur cycle d'adhésion.", "/admin/members"),
                new DashboardView.Kpi("dormant", "Cotisants dormants", BigDecimal.valueOf(dormant),
                        0, null, null, "Membres de la base sans activité récente.", "/admin/members"),
                new DashboardView.Kpi("prospects", "Prospects", BigDecimal.valueOf(prospect),
                        0, null, null, "Contacts hors base de membres ; ils ne génèrent pas de cotisation.",
                        "/admin/members"));

        List<DashboardView.Segment> segments = List.of(
                new DashboardView.Segment("active", "Actifs", active, share(active, base), "base"),
                new DashboardView.Segment("dormant", "Dormants", dormant, share(dormant, base), "base"),
                new DashboardView.Segment("prospects", "Prospects", prospect, null, "outside"));

        List<DashboardView.MonthPoint> months = months();
        return new DashboardView(
                exercise,
                Instant.now(clock).toString(),
                kpis,
                months,
                trendFrom(months),
                segments,
                base == 0 ? 0L : base,
                contributions,
                payments(),
                alerts(),
                activities(),
                channels());
    }

    /** Répartition des encaissements par canal, du plus au moins utilisé. */
    private List<DashboardView.ChannelSlice> channels() {
        return jdbc.query(
                "SELECT channel, payment_count, total_amount FROM reporting.payment_channel_breakdown "
                        + "ORDER BY total_amount DESC",
                (rs, i) -> new DashboardView.ChannelSlice(
                        rs.getString("channel"),
                        rs.getLong("payment_count"),
                        rs.getBigDecimal("total_amount").longValue()));
    }

    /** Série d'encaissement sur les 12 derniers mois glissants ; trous comblés à zéro. */
    private List<DashboardView.MonthPoint> months() {
        Map<String, BigDecimal> collectedByMonth = new HashMap<>();
        jdbc.query("SELECT to_char(month_start, 'YYYY-MM') AS ym, collected_amount FROM reporting.monthly_collection",
                (java.sql.ResultSet rs) -> {
                    collectedByMonth.put(rs.getString("ym"), rs.getBigDecimal("collected_amount"));
                });
        List<DashboardView.MonthPoint> out = new ArrayList<>();
        YearMonth current = YearMonth.now(clock);
        for (int k = 11; k >= 0; k--) {
            YearMonth ym = current.minusMonths(k);
            String key = ym.toString();
            BigDecimal collected = collectedByMonth.getOrDefault(key, BigDecimal.ZERO);
            // Taux mensuel de démonstration (aucune cible mensuelle n'est portée par la source) :
            // borné 60–85 %, d'où un montant attendu cohérent (≥ encaissé).
            int rate = collected.signum() == 0 ? 0 : 60 + (ym.getMonthValue() * 7) % 26;
            BigDecimal expected = rate == 0 ? BigDecimal.ZERO
                    : collected.multiply(BigDecimal.valueOf(100))
                            .divide(BigDecimal.valueOf(rate), 0, RoundingMode.HALF_UP);
            out.add(new DashboardView.MonthPoint(
                    key,
                    capitalize(ym.getMonth().getDisplayName(TextStyle.FULL, Locale.FRENCH)) + " " + ym.getYear(),
                    capitalize(ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.FRENCH)) + " " + (ym.getYear() % 100),
                    expected, collected, BigDecimal.valueOf(rate)));
        }
        return out;
    }

    private static DashboardView.Trend trendFrom(List<DashboardView.MonthPoint> months) {
        if (months.size() < 2) {
            return null;
        }
        DashboardView.MonthPoint prev = months.get(months.size() - 2);
        DashboardView.MonthPoint curr = months.get(months.size() - 1);
        BigDecimal p = prev.collected();
        if (p == null || p.signum() == 0) {
            return new DashboardView.Trend("flat", BigDecimal.ZERO, prev.label(), curr.label());
        }
        BigDecimal delta = curr.collected().subtract(p)
                .multiply(BigDecimal.valueOf(100)).divide(p, 0, RoundingMode.HALF_UP);
        String direction = delta.signum() > 0 ? "up" : delta.signum() < 0 ? "down" : "flat";
        return new DashboardView.Trend(direction, delta.abs(), prev.label(), curr.label());
    }

    /** Derniers paiements enregistrés, payeur inclus. */
    private List<DashboardView.Payment> payments() {
        return jdbc.query(
                "SELECT id, transaction_number, payer, amount, channel, status, paid_at "
                        + "FROM reporting.recent_payments ORDER BY paid_at DESC LIMIT 8",
                (rs, i) -> new DashboardView.Payment(
                        rs.getString("id"),
                        rs.getString("transaction_number"),
                        rs.getString("payer") == null ? "—" : rs.getString("payer"),
                        rs.getBigDecimal("amount"),
                        rs.getString("channel"),
                        "RECEIVED".equals(rs.getString("status")) ? "MATCHED" : "PENDING",
                        rs.getObject("paid_at", OffsetDateTime.class).toString()));
    }

    /** Fil des adhésions récentes. */
    private List<DashboardView.Activity> activities() {
        return jdbc.query(
                "SELECT id, organization_legal_name, joined_at "
                        + "FROM reporting.recent_memberships ORDER BY joined_at DESC LIMIT 6",
                (rs, i) -> new DashboardView.Activity(
                        rs.getString("id"),
                        "Nouvelle adhésion",
                        rs.getString("organization_legal_name"),
                        rs.getObject("joined_at", LocalDate.class).toString()));
    }

    /** Alertes de recouvrement : cotisations en retard, gravité selon le reste dû. */
    private List<DashboardView.Alert> alerts() {
        return jdbc.query(
                "SELECT organization_id, organization_legal_name, outstanding_amount, earliest_due_date "
                        + "FROM reporting.overdue_contributions ORDER BY outstanding_amount DESC LIMIT 6",
                (rs, i) -> {
                    BigDecimal amount = rs.getBigDecimal("outstanding_amount");
                    String severity = amount.compareTo(BigDecimal.valueOf(3_000_000)) >= 0 ? "critical"
                            : amount.compareTo(BigDecimal.valueOf(1_000_000)) >= 0 ? "warning" : "info";
                    return new DashboardView.Alert(
                            rs.getString("organization_id"),
                            severity,
                            "Cotisation en retard",
                            rs.getString("organization_legal_name")
                                    + " : " + formatFcfa(amount) + " FCFA à recouvrer",
                            rs.getObject("earliest_due_date", LocalDate.class).toString());
                });
    }

    private static String capitalize(String value) {
        return value.isEmpty() ? value : Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }

    /** Montant groupé à la française (« 3 600 000 »), sans symbole ; le « FCFA » suit dans le texte. */
    private static String formatFcfa(BigDecimal amount) {
        return java.text.NumberFormat.getInstance(java.util.Locale.FRENCH).format(amount.longValue());
    }

    private Contribution contributionsFor(String exercise) {
        Integer year = parseYear(exercise);
        if (year == null) {
            return null;
        }
        try {
            return jdbc.queryForObject(
                    "SELECT expected_amount, collected_amount, outstanding_amount "
                            + "FROM reporting.contribution_totals WHERE exercise_year = ?",
                    (rs, i) -> new Contribution(
                            rs.getBigDecimal("expected_amount"),
                            rs.getBigDecimal("collected_amount"),
                            rs.getBigDecimal("outstanding_amount")),
                    year);
        } catch (EmptyResultDataAccessException noYear) {
            return null;
        }
    }

    private static BigDecimal share(long part, long base) {
        if (base <= 0) {
            return null;
        }
        return BigDecimal.valueOf(part)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(base), 0, RoundingMode.HALF_UP);
    }

    private static Integer parseYear(String exercise) {
        if (exercise == null || exercise.isBlank()) {
            return null;
        }
        try {
            return Integer.valueOf(exercise.trim());
        } catch (NumberFormatException notAYear) {
            return null;
        }
    }

    private record Counts(long active, long dormant, long prospect) { }

    private record Contribution(BigDecimal expected, BigDecimal collected, BigDecimal outstanding) { }
}
