package ml.cnpm.platform.payment.adapter.in.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import ml.cnpm.platform.payment.application.ReconciliationView;
import ml.cnpm.platform.payment.application.StatementReconciliationService;
import ml.cnpm.platform.payment.application.StatementReconciliationService.ReconciliationOutcome;
import ml.cnpm.platform.shared.api.CorrelationId;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * Adaptateur HTTP du rapprochement automatique : import d'un relevé, files de cas, décision.
 *
 * <p>L'import propose des appariements sans rien écrire de financier ; c'est la décision de la
 * CNPM qui crée l'encaissement. Le contrôleur délègue au service, qui porte autorisation,
 * transaction et audit.
 */
@RestController
public class ReconciliationController {

    private final StatementReconciliationService service;

    public ReconciliationController(StatementReconciliationService service) {
        this.service = service;
    }

    @PostMapping("/bank-statements/import")
    public ReconciliationView.ImportSummary importStatement(
            @RequestHeader(name = "Idempotency-Key") @Size(min = 16, max = 160) String idempotencyKey,
            @Valid @RequestBody BankStatementImportInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return service.importStatement(
                input.toCommand(), actorId(authentication), CorrelationId.current(request));
    }

    @GetMapping("/reconciliations")
    public ReconciliationView.CaseList list() {
        return service.list();
    }

    @PostMapping("/reconciliations/{id}/decide")
    public ReconciliationOutcome decide(
            @RequestHeader(name = "Idempotency-Key") @Size(min = 16, max = 160) String idempotencyKey,
            @PathVariable("id") UUID id,
            @Valid @RequestBody ReconciliationDecisionInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return service.decide(
                id,
                input.confirm(),
                input.reason(),
                actorId(authentication),
                CorrelationId.current(request));
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
