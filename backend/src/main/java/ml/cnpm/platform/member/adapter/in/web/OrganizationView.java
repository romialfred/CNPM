package ml.cnpm.platform.member.adapter.in.web;

import java.util.UUID;
import ml.cnpm.platform.member.domain.Organization;

/**
 * Projection de sortie d'une entreprise, alignée sur le schéma {@code OrganizationView}
 * du contrat (typé, sans {@code additionalProperties}).
 */
public record OrganizationView(
        UUID id,
        String legalName,
        String tradeName,
        String organizationType,
        String sectorCode,
        String status,
        String riskLevel,
        long version) {

    static OrganizationView from(Organization organization) {
        return new OrganizationView(
                organization.id(),
                organization.legalName(),
                organization.tradeName(),
                organization.organizationType(),
                organization.sectorCode(),
                organization.status(),
                organization.riskLevel(),
                organization.version());
    }
}
