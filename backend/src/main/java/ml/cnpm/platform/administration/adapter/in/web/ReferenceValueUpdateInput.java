package ml.cnpm.platform.administration.adapter.in.web;

import jakarta.validation.constraints.Size;
import ml.cnpm.platform.administration.application.ReferenceValuePatch;

/**
 * Charge de mise à jour partielle reçue par {@code updateReferenceValue}, alignée sur le
 * schéma {@code ReferenceValueUpdate} du contrat.
 *
 * <p>Champs facultatifs : {@code null} signifie « inchangé ». Le domaine et le code ne
 * sont pas modifiables et n'y figurent pas. La validation ne s'applique qu'aux champs
 * réellement fournis.
 */
public record ReferenceValueUpdateInput(
        @Size(min = 1, max = 255) String label, Integer sortOrder, Boolean active) {

    ReferenceValuePatch toPatch() {
        return new ReferenceValuePatch(label, sortOrder, active);
    }
}
