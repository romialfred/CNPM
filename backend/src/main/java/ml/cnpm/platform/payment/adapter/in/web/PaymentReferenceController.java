package ml.cnpm.platform.payment.adapter.in.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import ml.cnpm.platform.payment.application.PaymentReferenceGeneration;
import ml.cnpm.platform.payment.application.PaymentReferenceService;
import ml.cnpm.platform.payment.application.PaymentReferenceView;
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
 * Adaptateur HTTP des références de paiement (génération par cotisant, validation exclusive CNPM).
 *
 * <p>Le contrôleur valide la forme, résout l'acteur et la corrélation, puis délègue au service
 * qui porte l'autorisation, la transaction, l'idempotence et l'audit.
 */
@RestController
public class PaymentReferenceController {

    private final PaymentReferenceService references;

    public PaymentReferenceController(PaymentReferenceService references) {
        this.references = references;
    }

    @GetMapping("/payment-references")
    public PaymentReferenceView.ReferenceList list() {
        return references.list();
    }

    @PostMapping("/payment-references")
    public ResponseEntity<PaymentReferenceView.Reference> create(
            @RequestHeader(name = "Idempotency-Key") @Size(min = 16, max = 100) String idempotencyKey,
            @Valid @RequestBody PaymentReferenceInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        PaymentReferenceGeneration outcome =
                references.generate(
                        input.membershipId(),
                        input.exercise(),
                        actorId(authentication),
                        CorrelationId.current(request));
        // 201 pour une génération réelle, 200 pour un rejeu qui renvoie la référence vivante.
        return ResponseEntity.status(outcome.created() ? HttpStatus.CREATED : HttpStatus.OK)
                .body(outcome.reference());
    }

    @PostMapping("/payment-references/{id}/validate")
    public PaymentReferenceView.Reference validate(
            @PathVariable("id") UUID id,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return references.validate(id, actorId(authentication), CorrelationId.current(request));
    }

    @PostMapping("/payment-references/{id}/revoke")
    public PaymentReferenceView.Reference revoke(
            @PathVariable("id") UUID id,
            @Valid @RequestBody PaymentReasonInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return references.revoke(
                id, input.reason(), actorId(authentication), CorrelationId.current(request));
    }

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
