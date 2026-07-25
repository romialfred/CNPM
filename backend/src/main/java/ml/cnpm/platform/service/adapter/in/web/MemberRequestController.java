package ml.cnpm.platform.service.adapter.in.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import ml.cnpm.platform.service.application.MemberRequestService;
import ml.cnpm.platform.service.application.MemberRequestView;
import ml.cnpm.platform.shared.api.CorrelationId;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Espace membre — requêtes et réclamations ({@code /portal/requests}).
 *
 * <p>Aucun identifiant d'organisation n'est accepté : le périmètre est déduit du compte
 * authentifié par le service. Le contrôleur valide la forme des entrées et délègue ; taille de
 * page bornée côté serveur ; la création exige une clé d'idempotence.
 */
@RestController
public class MemberRequestController {

    private final MemberRequestService service;

    public MemberRequestController(MemberRequestService service) {
        this.service = service;
    }

    @GetMapping("/portal/requests")
    public MemberRequestView.Page list(
            JwtAuthenticationToken authentication,
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        return service.list(accountId(authentication), page, size);
    }

    @GetMapping("/portal/requests/{id}")
    public MemberRequestView.Detail get(
            JwtAuthenticationToken authentication, @PathVariable("id") UUID id) {
        return service.detail(accountId(authentication), id);
    }

    @PostMapping("/portal/requests")
    @ResponseStatus(HttpStatus.CREATED)
    public MemberRequestView.Detail create(
            JwtAuthenticationToken authentication,
            HttpServletRequest request,
            @RequestHeader(name = "Idempotency-Key") @Size(min = 16, max = 160) String idempotencyKey,
            @Valid @RequestBody CreateRequestInput input) {
        return service.create(
                accountId(authentication),
                input.type(),
                input.subject(),
                input.description(),
                idempotencyKey,
                accountId(authentication),
                CorrelationId.current(request));
    }

    @PostMapping("/portal/requests/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MemberRequestView.Detail addMessage(
            JwtAuthenticationToken authentication,
            HttpServletRequest request,
            @PathVariable("id") UUID id,
            @Valid @RequestBody AddMessageInput input) {
        return service.addMessage(
                accountId(authentication),
                id,
                input.body(),
                accountId(authentication),
                CorrelationId.current(request));
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

    /** Corps de création : type fermé au périmètre membre, objet et description bornés. */
    public record CreateRequestInput(
            @NotBlank @Pattern(regexp = "INFORMATION|DOCUMENT|CLAIM|OTHER") String type,
            @NotBlank @Size(max = 255) String subject,
            @NotBlank @Size(max = 4000) String description) {}

    /** Corps d'un échange membre. */
    public record AddMessageInput(@NotBlank @Size(max = 4000) String body) {}
}
