package ml.cnpm.platform.administration.adapter.in.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import ml.cnpm.platform.administration.application.AdminAccountDraft;

/**
 * Corps de {@code POST /admin/security/accounts}.
 *
 * <p>Aucun mot de passe n'est accepté : le champ n'existe pas, donc il ne peut ni être
 * transmis, ni journalisé, ni oublié dans une trace. La forme est validée au bord du
 * système ; les règles (unicité, cohérence du lien d'adhésion, existence du rôle) restent
 * au service applicatif.
 */
public record AdminAccountInput(
        @NotBlank @Pattern(regexp = "PROFESSIONAL|MEMBER") String accountType,
        @NotBlank @Size(max = 120) String firstName,
        @NotBlank @Size(max = 120) String lastName,
        @NotBlank @Email @Size(max = 320) String email,
        @Size(max = 40) String phone,
        @Size(max = 150) String jobTitle,
        @Size(max = 255) String organization,
        @Size(max = 150) String department,
        @NotNull UUID roleId,
        UUID memberId) {

    public AdminAccountDraft toDraft() {
        return new AdminAccountDraft(
                accountType,
                firstName,
                lastName,
                email,
                phone,
                jobTitle,
                organization,
                department,
                roleId,
                memberId);
    }
}
