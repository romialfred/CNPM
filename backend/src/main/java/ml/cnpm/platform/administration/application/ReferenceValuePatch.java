package ml.cnpm.platform.administration.application;

/**
 * Modification partielle d'une valeur de référentiel : seuls les champs non
 * {@code null} sont appliqués.
 *
 * <p>Le domaine et le code n'y figurent pas — ils forment l'identité et ne sont pas
 * modifiables. Un champ {@code null} signifie « inchangé », conformément à la sémantique
 * PATCH du contrat.
 */
public record ReferenceValuePatch(String label, Integer sortOrder, Boolean active) {

    /** Vrai si la modification ne porte réellement aucun changement. */
    public boolean isEmpty() {
        return label == null && sortOrder == null && active == null;
    }
}
