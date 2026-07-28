package ml.cnpm.platform.professionalgroup.adapter.in.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import ml.cnpm.platform.professionalgroup.application.ProfessionalGroupService;
import ml.cnpm.platform.professionalgroup.domain.ProfessionalGroup;
import ml.cnpm.platform.shared.api.CorrelationId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Adaptateur HTTP du référentiel des groupements : consultation et création. */
@RestController
public class ProfessionalGroupController {

    private final ProfessionalGroupService service;

    public ProfessionalGroupController(ProfessionalGroupService service) {
        this.service = service;
    }

    @GetMapping("/professional-groups")
    public ProfessionalGroupPageView list(
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        return ProfessionalGroupPageView.from(service.list(page, size));
    }

    @GetMapping("/professional-groups/{id}")
    public ProfessionalGroupView get(@PathVariable("id") UUID id) {
        return ProfessionalGroupView.from(service.get(id));
    }

    /**
     * Crée un groupement. Le contrôleur ne porte que la validation de forme et la résolution
     * de l'acteur et de la corrélation ; l'autorisation, la transaction, l'unicité et l'audit
     * sont portés par le service applicatif.
     */
    @PostMapping("/professional-groups")
    public ResponseEntity<ProfessionalGroupView> create(
            @Valid @RequestBody CreateProfessionalGroupInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        ProfessionalGroup created =
                service.create(
                        input.toCommand(), actorId(authentication), CorrelationId.current(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(ProfessionalGroupView.from(created));
    }

    /** Sujet du jeton s'il est un UUID, {@code null} sinon — l'audit préfère un acteur absent. */
    private static UUID actorId(JwtAuthenticationToken authentication) {
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
