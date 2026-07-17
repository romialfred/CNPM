package ml.cnpm.platform.administration.adapter.in.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import ml.cnpm.platform.administration.application.ReferenceValueCreation;
import ml.cnpm.platform.administration.application.ReferenceValueService;
import ml.cnpm.platform.administration.domain.ReferenceValue;
import ml.cnpm.platform.shared.api.CorrelationId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Adaptateur entrant HTTP du module ADM ({@code listReferenceValues},
 * {@code createReferenceValue}).
 *
 * <p>Le contrôleur ne porte aucune règle métier ni décision d'autorisation : il valide
 * la forme des entrées au bord du système, délègue au service applicatif (qui porte le
 * {@code @PreAuthorize} et l'idempotence) et projette le résultat vers le DTO du contrat.
 * La taille de page est bornée côté serveur ({@code .claude/rules/api.md}).
 */
@RestController
public class ReferenceValueController {

    private final ReferenceValueService service;

    public ReferenceValueController(ReferenceValueService service) {
        this.service = service;
    }

    @GetMapping("/reference-values")
    public ReferenceValuePageView list(
            @RequestParam(name = "domain", required = false) @Size(max = 80) String domain,
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        return ReferenceValuePageView.from(service.list(domain, page, size));
    }

    @PostMapping("/reference-values")
    public ResponseEntity<ReferenceValueView> create(
            @RequestHeader(name = "Idempotency-Key") @Size(min = 16, max = 100) String idempotencyKey,
            @Valid @RequestBody ReferenceValueInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        ReferenceValueCreation outcome =
                service.create(
                        input.toDraft(), actorId(authentication), CorrelationId.current(request));
        ReferenceValueView view = ReferenceValueView.from(outcome.value());
        // 201 pour une création réelle, 200 pour un rejeu idempotent d'une valeur identique.
        return ResponseEntity.status(outcome.created() ? HttpStatus.CREATED : HttpStatus.OK)
                .body(view);
    }

    @PatchMapping("/reference-values/{id}")
    public ReferenceValueView update(
            @PathVariable("id") UUID id,
            @RequestHeader(name = "If-Match") long expectedVersion,
            @Valid @RequestBody ReferenceValueUpdateInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        ReferenceValue updated =
                service.update(
                        id,
                        expectedVersion,
                        input.toPatch(),
                        actorId(authentication),
                        CorrelationId.current(request));
        return ReferenceValueView.from(updated);
    }

    /**
     * Identifiant de l'acteur pour l'audit : le sujet du jeton s'il est un UUID (cas
     * Keycloak), {@code null} sinon — l'audit préfère un acteur absent à un acteur
     * fabriqué.
     */
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
