package ml.cnpm.platform.enrollment.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import ml.cnpm.platform.enrollment.application.EnrollmentCaseDraft;

/**
 * Corps de création d'un dossier d'adhésion.
 *
 * <p>Seule la forme est validée (obligatoires, longueurs). Aucun contrôle de format n'est
 * appliqué aux identifiants métier de l'entreprise : ENR-003 exige un contrôle, mais aucun
 * masque RCCM/NIF n'est fourni par les sources — différé, corrigeable sans rupture.
 */
public record EnrollmentApplicationInput(
        @NotBlank @Size(max = 60) String caseNumber,
        @NotNull UUID organizationId,
        @NotBlank @Size(max = 30) String channel) {

    EnrollmentCaseDraft toDraft() {
        return new EnrollmentCaseDraft(caseNumber, organizationId, channel);
    }
}
