package ml.cnpm.platform.payment.adapter.in.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import ml.cnpm.platform.payment.application.CollectionAccountService;
import ml.cnpm.platform.payment.application.CollectionAccountView;
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
 * Adaptateur HTTP des comptes d'encaissement de la CNPM (configuration des coordonnées Orange
 * Money, Wave, MTN, virement).
 *
 * <p>Le contrôleur ne porte ni règle métier ni décision d'autorisation : il valide la forme
 * des entrées, résout l'acteur et la corrélation, puis délègue au service qui porte
 * {@code @PreAuthorize}, transaction, séparation des tâches et audit.
 */
@RestController
public class CollectionAccountController {

    private final CollectionAccountService accounts;

    public CollectionAccountController(CollectionAccountService accounts) {
        this.accounts = accounts;
    }

    @GetMapping("/collection-accounts")
    public CollectionAccountView.CollectionAccountList list() {
        return accounts.list();
    }

    @PostMapping("/collection-accounts")
    public ResponseEntity<CollectionAccountView.Account> create(
            @RequestHeader(name = "Idempotency-Key") @Size(min = 16, max = 100) String idempotencyKey,
            @Valid @RequestBody CollectionAccountInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        CollectionAccountView.Account created =
                accounts.create(
                        input.toDraft(), actorId(authentication), CorrelationId.current(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/collection-accounts/{accountId}/approve")
    public CollectionAccountView.Account approve(
            @PathVariable("accountId") UUID accountId,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return accounts.approve(accountId, actorId(authentication), CorrelationId.current(request));
    }

    @PostMapping("/collection-accounts/{accountId}/disable")
    public CollectionAccountView.Account disable(
            @PathVariable("accountId") UUID accountId,
            @Valid @RequestBody CollectionAccountReasonInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return accounts.disable(
                accountId, input.reason(), actorId(authentication), CorrelationId.current(request));
    }

    /** Sujet du jeton en UUID, ou {@code null} — l'audit préfère un acteur absent à un fabriqué. */
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
