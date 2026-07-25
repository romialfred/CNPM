package ml.cnpm.platform.member.adapter.in.web;

import java.util.UUID;
import ml.cnpm.platform.member.application.MemberDashboardService;
import ml.cnpm.platform.member.application.MemberDashboardView;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Espace membre — tableau de bord ({@code GET /portal/dashboard}).
 *
 * <p>Aucun identifiant d'adhésion n'est accepté : le périmètre est déduit du compte authentifié
 * par le service. Le contrôleur ne fait que résoudre l'acteur et déléguer.
 */
@RestController
public class MemberDashboardController {

    private final MemberDashboardService service;

    public MemberDashboardController(MemberDashboardService service) {
        this.service = service;
    }

    @GetMapping("/portal/dashboard")
    public MemberDashboardView.Dashboard dashboard(JwtAuthenticationToken authentication) {
        return service.dashboard(accountId(authentication));
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
