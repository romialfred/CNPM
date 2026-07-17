package ml.cnpm.platform.member.adapter.in.web;

import jakarta.validation.constraints.Size;
import ml.cnpm.platform.member.application.OrganizationPatch;

/**
 * Charge de mise à jour partielle reçue par {@code updateOrganization}, alignée sur le
 * schéma {@code OrganizationUpdate} du contrat.
 *
 * <p>Champs facultatifs : {@code null} signifie « inchangé ». Le statut, le niveau de
 * risque et l'identifiant métier ne sont pas modifiables ici et n'y figurent pas. La
 * validation ne s'applique qu'aux champs réellement fournis.
 */
public record OrganizationUpdateInput(
        @Size(min = 1, max = 255) String legalName,
        @Size(max = 255) String tradeName,
        @Size(min = 1, max = 40) String organizationType,
        @Size(max = 80) String sectorCode) {

    OrganizationPatch toPatch() {
        return new OrganizationPatch(legalName, tradeName, organizationType, sectorCode);
    }
}
