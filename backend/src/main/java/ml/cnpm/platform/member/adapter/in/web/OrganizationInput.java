package ml.cnpm.platform.member.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import ml.cnpm.platform.member.application.OrganizationDraft;

/**
 * Corps de création d'une entreprise, aligné sur le schéma {@code OrganizationInput} du
 * contrat. La validation de forme (obligatoires, longueurs) se fait au bord du système ;
 * le statut initial et le niveau de risque ne sont pas fournis par le client.
 */
public record OrganizationInput(
        @NotBlank @Size(max = 255) String legalName,
        @Size(max = 255) String tradeName,
        @NotBlank @Size(max = 40) String organizationType,
        @Size(max = 80) String sectorCode,
        @NotBlank @Size(max = 40) String identifierType,
        @NotBlank @Size(max = 160) String identifierValue) {

    OrganizationDraft toDraft() {
        return new OrganizationDraft(
                legalName, tradeName, organizationType, sectorCode, identifierType, identifierValue);
    }
}
