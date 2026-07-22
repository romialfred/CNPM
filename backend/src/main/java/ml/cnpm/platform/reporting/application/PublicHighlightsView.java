package ml.cnpm.platform.reporting.application;

import java.util.List;

/**
 * Chiffres clés publics de l'accueil (PUB-001), projetés vers le contrat front
 * {@code PublicHighlights}.
 *
 * <p>{@code news} reste toujours vide côté serveur : l'éditorial est strictement réservé au
 * profil de démonstration (garde {@code fictionalDemo} du contrat). {@code dataAsOf} porte la
 * date de constat exigée par la fiche.
 */
public record PublicHighlightsView(
        List<Metric> metrics,
        List<Object> news,
        String sourceNotice,
        String dataAsOf) {

    /** Indicateur public ; {@code unit} vaut {@code null} pour un simple dénombrement. */
    public record Metric(String id, String label, long value, String unit) { }
}
