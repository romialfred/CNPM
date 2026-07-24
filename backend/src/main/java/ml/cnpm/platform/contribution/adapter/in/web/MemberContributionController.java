package ml.cnpm.platform.contribution.adapter.in.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;
import ml.cnpm.platform.contribution.application.MemberContributionQueryService;
import ml.cnpm.platform.contribution.application.MemberContributionView;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Espace membre — mes cotisations ({@code GET /portal/contributions}).
 *
 * <p>Aucun identifiant d'adhésion n'est accepté en entrée : le périmètre est déduit du
 * compte authentifié par le service. Exposer un tel paramètre suffirait à transformer cet
 * écran en fuite de données entre membres.
 */
@RestController
public class MemberContributionController {

    private final MemberContributionQueryService service;

    public MemberContributionController(MemberContributionQueryService service) {
        this.service = service;
    }

    @GetMapping("/portal/contributions")
    public MemberContributionView.Page list(
            @RequestParam(name = "status", required = false)
                    @Pattern(regexp = "A_ECHOIR|EN_RETARD|PARTIELLE|REGLEE")
                    String status,
            @RequestParam(name = "exercise", required = false) @Min(2000) @Max(2999) Integer exercise,
            @RequestParam(name = "sort", defaultValue = "dueDate")
                    @Pattern(regexp = "dueDate|reference|status")
                    String sort,
            @RequestParam(name = "direction", defaultValue = "asc") @Pattern(regexp = "asc|desc")
                    String direction,
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size,
            JwtAuthenticationToken authentication) {
        return service.list(
                accountId(authentication), status, exercise, sort, "desc".equals(direction), page, size);
    }

    @GetMapping("/portal/contributions/{contributionId}")
    public MemberContributionView.Detail detail(
            @PathVariable("contributionId") UUID contributionId,
            JwtAuthenticationToken authentication) {
        return service.detail(accountId(authentication), contributionId);
    }

    /**
     * Compte authentifié. Un sujet qui n'est pas un UUID ne désigne aucun compte de la
     * plateforme : le service refusera, plutôt que d'élargir le périmètre par défaut.
     */
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
