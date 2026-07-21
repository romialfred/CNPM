package ml.cnpm.platform.reporting.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.util.List;

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

        return new DashboardView(
                exercise,
                Instant.now(clock).toString(),
                kpis,
                List.of(),
                null,
                segments,
                base == 0 ? 0L : base,
                contributions,
                List.of(),
                List.of(),
                List.of());
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
