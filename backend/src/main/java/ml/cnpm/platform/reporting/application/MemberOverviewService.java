package ml.cnpm.platform.reporting.application;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Synthèse du répertoire des membres (BO-002), agrégée depuis le read model {@code reporting.*}.
 *
 * <p>Alimente le volet de synthèse (effectifs, cotisations), les options de filtre (catégories,
 * groupements) et les colonnes financières par organisation. Le module reporting ne lit que son
 * propre schéma ; aucune donnée nominative n'est renvoyée.
 */
@Service
public class MemberOverviewService {

    private static final String LARGE_CONTRIBUTOR_CATEGORY = "GRANDE_ENTREPRISE";

    private final JdbcTemplate jdbc;

    MemberOverviewService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @PreAuthorize("hasAuthority('PERM_MEMBER.READ')")
    @Transactional(readOnly = true)
    public MemberOverviewView load() {
        long[] status = jdbc.queryForObject(
                "SELECT active_count, dormant_count, prospect_count FROM reporting.member_status_counts",
                (rs, i) -> new long[] {rs.getLong("active_count"), rs.getLong("dormant_count"),
                        rs.getLong("prospect_count")});
        long active = status == null ? 0 : status[0];
        long dormant = status == null ? 0 : status[1];
        long prospects = status == null ? 0 : status[2];

        Long large = jdbc.queryForObject(
                "SELECT coalesce(sum(member_count), 0) FROM reporting.member_category_counts WHERE category_code = ?",
                Long.class, LARGE_CONTRIBUTOR_CATEGORY);

        BigDecimal[] money = jdbc.queryForObject(
                "SELECT coalesce(sum(expected_amount), 0) AS e, coalesce(sum(collected_amount), 0) AS c "
                        + "FROM reporting.member_financials",
                (rs, i) -> new BigDecimal[] {rs.getBigDecimal("e"), rs.getBigDecimal("c")});
        long expected = money == null ? 0 : money[0].longValue();
        long collected = money == null ? 0 : money[1].longValue();
        Integer recoveryRate = expected > 0 ? (int) Math.round(collected * 100.0 / expected) : null;

        MemberOverviewView.Overview overview = new MemberOverviewView.Overview(
                active + dormant, active, dormant, prospects, large == null ? 0 : large,
                expected, collected, recoveryRate);

        List<String> categories = jdbc.query(
                "SELECT category_code FROM reporting.member_category_counts ORDER BY category_code",
                (rs, i) -> rs.getString("category_code"));
        List<String> groups = jdbc.query(
                "SELECT name FROM reporting.member_groups ORDER BY name",
                (rs, i) -> rs.getString("name"));
        List<MemberOverviewView.Financial> financials = jdbc.query(
                "SELECT organization_id, expected_amount, collected_amount FROM reporting.member_financials",
                (rs, i) -> new MemberOverviewView.Financial(
                        rs.getString("organization_id"),
                        rs.getBigDecimal("expected_amount").longValue(),
                        rs.getBigDecimal("collected_amount").longValue()));

        return new MemberOverviewView(overview, categories, groups, financials);
    }
}
