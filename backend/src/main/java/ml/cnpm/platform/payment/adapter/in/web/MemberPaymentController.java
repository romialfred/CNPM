package ml.cnpm.platform.payment.adapter.in.web;

import java.util.UUID;
import ml.cnpm.platform.payment.application.MemberPaymentInstructionsView;
import ml.cnpm.platform.payment.application.MemberPaymentQueryService;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Espace membre — instructions de paiement ({@code GET /portal/payment-instructions}).
 *
 * <p>Aucun identifiant d'adhésion n'est accepté : le périmètre est déduit du compte authentifié
 * par le service. Le contrôleur ne fait que résoudre l'acteur et déléguer.
 */
@RestController
public class MemberPaymentController {

    private final MemberPaymentQueryService service;

    public MemberPaymentController(MemberPaymentQueryService service) {
        this.service = service;
    }

    @GetMapping("/portal/payment-instructions")
    public MemberPaymentInstructionsView.Instructions instructions(
            JwtAuthenticationToken authentication) {
        return service.instructions(accountId(authentication));
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
