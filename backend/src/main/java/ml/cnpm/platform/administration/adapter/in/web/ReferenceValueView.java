package ml.cnpm.platform.administration.adapter.in.web;

import java.time.Instant;
import java.util.UUID;
import ml.cnpm.platform.administration.domain.ReferenceValue;

/**
 * Projection de sortie d'une valeur de référentiel, alignée sur le schéma
 * {@code ReferenceValueView} du contrat OpenAPI (typé, sans {@code additionalProperties}).
 *
 * <p>DTO distinct du modèle de domaine : le contrat d'API évolue indépendamment de la
 * structure interne.
 */
public record ReferenceValueView(
        UUID id,
        String domain,
        String code,
        String label,
        int sortOrder,
        boolean active,
        Instant validFrom,
        Instant validTo) {

    static ReferenceValueView from(ReferenceValue value) {
        return new ReferenceValueView(
                value.id(),
                value.domain(),
                value.code(),
                value.label(),
                value.sortOrder(),
                value.active(),
                value.validFrom(),
                value.validTo());
    }
}
