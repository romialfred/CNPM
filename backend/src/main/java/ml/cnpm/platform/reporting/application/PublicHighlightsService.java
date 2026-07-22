package ml.cnpm.platform.reporting.application;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Chiffres clés publics de l'accueil (PUB-001), agrégés depuis le read model {@code reporting.*}
 * en lecture seule. Aucun accès aux tables privées des autres modules ; aucune donnée nominative.
 *
 * <p>Endpoint public : pas d'habilitation, seulement des dénombrements non sensibles. Base vide ⇒
 * compteurs à zéro, jamais une valeur inventée.
 */
@Service
public class PublicHighlightsService {

    private static final String SOURCE_NOTICE =
            "Chiffres établis à partir du registre des membres du CNPM.";

    private final JdbcTemplate jdbc;
    private final Clock clock;

    @Autowired
    PublicHighlightsService(JdbcTemplate jdbc) {
        this(jdbc, Clock.systemUTC());
    }

    PublicHighlightsService(JdbcTemplate jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PublicHighlightsView load() {
        long[] counts = jdbc.queryForObject(
                "SELECT active_count, dormant_count FROM reporting.member_status_counts",
                (rs, i) -> new long[] {rs.getLong("active_count"), rs.getLong("dormant_count")});
        long active = counts == null ? 0 : counts[0];
        long base = counts == null ? 0 : counts[0] + counts[1];

        List<PublicHighlightsView.Metric> metrics = List.of(
                new PublicHighlightsView.Metric("members", "Entreprises membres", base, null),
                new PublicHighlightsView.Metric("active-members", "Membres actifs", active, null));

        return new PublicHighlightsView(metrics, List.of(), SOURCE_NOTICE, Instant.now(clock).toString());
    }
}
