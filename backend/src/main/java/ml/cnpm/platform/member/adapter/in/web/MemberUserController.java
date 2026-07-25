package ml.cnpm.platform.member.adapter.in.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import ml.cnpm.platform.member.application.MemberUserQueryService;
import ml.cnpm.platform.member.application.MemberUserView;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Espace membre — utilisateurs de l'organisation ({@code GET /portal/users}).
 *
 * <p>Aucun identifiant d'organisation n'est accepté : le périmètre est déduit du compte
 * authentifié par le service. Taille de page bornée côté serveur.
 */
@RestController
public class MemberUserController {

    private final MemberUserQueryService service;

    public MemberUserController(MemberUserQueryService service) {
        this.service = service;
    }

    @GetMapping("/portal/users")
    public MemberUserView.Page list(
            JwtAuthenticationToken authentication,
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        return service.list(accountId(authentication), page, size);
    }

    /** Compte authentifié ; un sujet non-UUID ne désigne aucun compte et sera refusé au service. */
    private static UUID accountId(JwtAuthenticationToken authentication) {
        String subject = authentication.getToken().getSubject();
        if (subject == null) {
            return null;
        }
        try {
            return UUID.fromString(subject);
        } catch (IllegalArgumentException notAUuid) {
            return null;
        }
    }
}
