package ml.cnpm.platform.administration.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import ml.cnpm.platform.administration.application.ReferenceValueDraft;

/**
 * Charge de création reçue par {@code createReferenceValue}, alignée sur le schéma
 * {@code ReferenceValueInput} du contrat OpenAPI.
 *
 * <p>La validation de forme est portée par les annotations et vérifiée au bord du
 * système ; les invariants métier restent au domaine. {@code sortOrder} et {@code active}
 * sont facultatifs, avec les valeurs par défaut du contrat.
 */
public record ReferenceValueInput(
        @NotBlank @Size(max = 80) String domain,
        @NotBlank @Size(max = 80) String code,
        @NotBlank @Size(max = 255) String label,
        Integer sortOrder,
        Boolean active) {

    ReferenceValueDraft toDraft() {
        return new ReferenceValueDraft(
                domain, code, label, sortOrder == null ? 0 : sortOrder, active == null || active);
    }
}
