package ml.cnpm.platform.shared.security.profile;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import ml.cnpm.platform.shared.api.CorrelationId;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Espace membre — profil et photo du compte connecté ({@code /portal/profile}).
 *
 * <p>Aucun identifiant de compte n'est accepté : le périmètre est celui du jeton. Le contrôleur
 * résout l'acteur et délègue au service ; celui-ci n'opère que sur ce compte.
 */
@RestController
public class MemberProfileController {

    /** Corps du changement de photo : type MIME et contenu base64 (préfixe data: toléré). */
    public record AvatarInput(
            @NotBlank @Size(max = 60) String contentType,
            @NotBlank @Size(max = 1_400_000) String base64) {}

    private final MemberProfileService service;

    public MemberProfileController(MemberProfileService service) {
        this.service = service;
    }

    @GetMapping("/portal/profile")
    public MemberProfileView profile(JwtAuthenticationToken authentication) {
        return service.get(accountId(authentication));
    }

    @PutMapping("/portal/profile/avatar")
    public MemberProfileView updateAvatar(
            @Valid @RequestBody AvatarInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return service.updateAvatar(
                accountId(authentication),
                input.contentType(),
                input.base64(),
                CorrelationId.current(request));
    }

    @DeleteMapping("/portal/profile/avatar")
    public MemberProfileView deleteAvatar(
            JwtAuthenticationToken authentication, HttpServletRequest request) {
        return service.deleteAvatar(accountId(authentication), CorrelationId.current(request));
    }

    private static UUID accountId(JwtAuthenticationToken authentication) {
        String subject = authentication.getToken().getSubject();
        if (subject == null) {
            throw new IllegalStateException("Jeton sans sujet.");
        }
        return UUID.fromString(subject);
    }
}
