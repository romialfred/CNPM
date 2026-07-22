package ml.cnpm.platform.reporting.application;

import java.util.List;

/**
 * Synthèse du répertoire des membres (BO-002) : volet de synthèse (effectifs, cotisations),
 * options de filtre et agrégats financiers par organisation. Lecture seule.
 */
public record MemberOverviewView(
        Overview overview,
        List<String> categories,
        List<String> groups,
        List<Financial> financials) {

    public record Overview(
            long membersTotal, long active, long dormant, long prospects, long largeContributors,
            long expected, long collected, Integer recoveryRate) { }

    /** Cotisation due (appelée) et payée (réglée) d'une organisation, pour la ligne du répertoire. */
    public record Financial(String organizationId, long due, long paid) { }
}
