package ml.cnpm.platform.professionalgroup.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import ml.cnpm.platform.professionalgroup.application.CreateProfessionalGroupCommand;

/**
 * Corps de la création d'un groupement. La forme est validée au bord ; l'unicité du code et
 * la normalisation restent portées par le service applicatif.
 */
public record CreateProfessionalGroupInput(
        @NotBlank @Size(max = 60) String code,
        @NotBlank @Size(max = 255) String name,
        @Size(max = 80) String sectorCode) {

    CreateProfessionalGroupCommand toCommand() {
        return new CreateProfessionalGroupCommand(code, name, sectorCode);
    }
}
