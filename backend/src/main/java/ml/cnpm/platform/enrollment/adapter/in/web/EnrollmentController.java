package ml.cnpm.platform.enrollment.adapter.in.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import ml.cnpm.platform.enrollment.application.EnrollmentCaseCreation;
import ml.cnpm.platform.enrollment.application.EnrollmentCaseService;
import ml.cnpm.platform.shared.api.CorrelationId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * Adaptateur entrant HTTP du module ENROLLMENT — cycle de vie du dossier d'adhésion.
 *
 * <p>Le contrôleur ne porte ni règle métier ni décision d'autorisation : il valide la forme
 * des entrées, délègue au service (qui porte les {@code @PreAuthorize} et la machine à états)
 * et projette le résultat. Une transition interdite remonte en 409 {@code Problem}.
 */
@RestController
public class EnrollmentController {

    private final EnrollmentCaseService service;

    public EnrollmentController(EnrollmentCaseService service) {
        this.service = service;
    }

    /** Crée un dossier au statut {@code DRAFT}. Idempotent sur le numéro de dossier. */
    @PostMapping("/enrollment-applications")
    public ResponseEntity<EnrollmentApplicationView> create(
            @RequestHeader(name = "Idempotency-Key") @Size(min = 16, max = 100) String idempotencyKey,
            @Valid @RequestBody EnrollmentApplicationInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        EnrollmentCaseCreation outcome =
                service.create(input.toDraft(), actorId(authentication), CorrelationId.current(request));
        return ResponseEntity.status(outcome.created() ? HttpStatus.CREATED : HttpStatus.OK)
                .body(EnrollmentApplicationView.from(outcome.value()));
    }

    @GetMapping("/enrollment-applications/{id}")
    public EnrollmentApplicationView get(@PathVariable("id") UUID id) {
        return EnrollmentApplicationView.from(service.get(id));
    }

    /**
     * Soumet le dossier. L'en-tête {@code Idempotency-Key} est exigé par le contrat ; le rejeu
     * reste protégé par la garde d'état (une seconde soumission produit un 409), la sémantique
     * complète de rejeu attendant le magasin de clés générique (DATA-DEC-005).
     */
    @PostMapping("/enrollment-applications/{id}/submit")
    public EnrollmentApplicationView submit(
            @PathVariable("id") UUID id,
            @RequestHeader(name = "Idempotency-Key") @Size(min = 16, max = 100) String idempotencyKey,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return EnrollmentApplicationView.from(
                service.submit(id, actorId(authentication), CorrelationId.current(request)));
    }

    /** Prend le dossier en charge pour contrôle — prérequis de toute décision. */
    @PostMapping("/enrollment-applications/{id}/start-review")
    public EnrollmentApplicationView startReview(
            @PathVariable("id") UUID id,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return EnrollmentApplicationView.from(
                service.startReview(id, actorId(authentication), CorrelationId.current(request)));
    }

    @PostMapping("/enrollment-applications/{id}/request-complement")
    public EnrollmentApplicationView requestComplement(
            @PathVariable("id") UUID id,
            @Valid @RequestBody ComplementRequestInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return EnrollmentApplicationView.from(
                service.requestComplement(
                        id, input.comment(), actorId(authentication), CorrelationId.current(request)));
    }

    @PostMapping("/enrollment-applications/{id}/approve")
    public EnrollmentApplicationView approve(
            @PathVariable("id") UUID id,
            @RequestHeader(name = "Idempotency-Key") @Size(min = 16, max = 100) String idempotencyKey,
            @Valid @RequestBody DecisionInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return EnrollmentApplicationView.from(
                service.approve(
                        id, input.comment(), actorId(authentication), CorrelationId.current(request)));
    }

    /** Rejette le dossier. Le motif ({@code comment}) est obligatoire. */
    @PostMapping("/enrollment-applications/{id}/reject")
    public EnrollmentApplicationView reject(
            @PathVariable("id") UUID id,
            @Valid @RequestBody RejectionInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return EnrollmentApplicationView.from(
                service.reject(
                        id,
                        input.reasonCode(),
                        input.comment(),
                        actorId(authentication),
                        CorrelationId.current(request)));
    }

    /**
     * Identifiant de l'acteur : le sujet du jeton s'il est un UUID (cas Keycloak), {@code null}
     * sinon — l'audit préfère un acteur absent à un acteur fabriqué. Une décision, elle, exige
     * un acteur identifiable et est refusée sans lui.
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
