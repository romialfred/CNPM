package ml.cnpm.platform.payment.adapter.in.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import ml.cnpm.platform.payment.application.PaymentRecording;
import ml.cnpm.platform.payment.application.PaymentRecordingService;
import ml.cnpm.platform.payment.application.PaymentTransactionView;
import ml.cnpm.platform.shared.api.CorrelationId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * Adaptateur HTTP des encaissements (enregistrement par un agent CNPM, consultation).
 *
 * <p>La clé d'idempotence de l'en-tête est celle de l'écriture : le même encaissement rejoué
 * renvoie l'existant (200) plutôt que d'en créer un second (201). Le contrôleur ne porte ni
 * règle ni autorisation ; il délègue au service.
 */
@RestController
public class PaymentController {

    private final PaymentRecordingService service;

    public PaymentController(PaymentRecordingService service) {
        this.service = service;
    }

    @GetMapping("/payments")
    public PaymentTransactionView.PaymentList list() {
        return service.list();
    }

    @PostMapping("/payments")
    public ResponseEntity<PaymentTransactionView.Payment> record(
            @RequestHeader(name = "Idempotency-Key") @Size(min = 16, max = 160) String idempotencyKey,
            @Valid @RequestBody PaymentRecordInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        PaymentRecording outcome =
                service.record(
                        input.referenceId(),
                        input.channel(),
                        input.amountValue(),
                        input.paidAtOrNow(),
                        input.providerTransactionId(),
                        idempotencyKey,
                        actorId(authentication),
                        CorrelationId.current(request));
        return ResponseEntity.status(outcome.created() ? HttpStatus.CREATED : HttpStatus.OK)
                .body(outcome.payment());
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
