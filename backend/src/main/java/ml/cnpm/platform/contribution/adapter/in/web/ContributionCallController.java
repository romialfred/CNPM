package ml.cnpm.platform.contribution.adapter.in.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ml.cnpm.platform.contribution.application.ContributionCallIssuance;
import ml.cnpm.platform.contribution.application.ContributionCallService;
import ml.cnpm.platform.shared.api.CorrelationId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Adaptateur entrant HTTP du module COTISATION : émission et consultation des appels.
 *
 * <p>Le contrôleur valide la forme et délègue au service, qui porte les {@code @PreAuthorize}
 * et l'idempotence.
 */
@RestController
public class ContributionCallController {

    private final ContributionCallService service;

    public ContributionCallController(ContributionCallService service) {
        this.service = service;
    }

    /** Émet un appel de cotisation. Idempotent sur le numéro d'appel : 201 création, 200 rejeu. */
    @PostMapping("/contribution-calls")
    public ResponseEntity<ContributionCallView> issue(
            @RequestHeader(name = "Idempotency-Key") @Size(min = 16, max = 100) String idempotencyKey,
            @Valid @RequestBody ContributionCallInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        ContributionCallIssuance outcome =
                service.issue(input.toDraft(), actorId(authentication), CorrelationId.current(request));
        return ResponseEntity.status(outcome.issued() ? HttpStatus.CREATED : HttpStatus.OK)
                .body(ContributionCallView.from(outcome.value()));
    }

    /** Appels d'un membre, avec leur reste dû et le total dû. */
    @GetMapping("/contribution-calls")
    public MemberContributionsView list(@RequestParam("membershipId") UUID membershipId) {
        List<ContributionCallView> items =
                service.listByMembership(membershipId).stream().map(ContributionCallView::from).toList();
        BigDecimal outstanding = service.outstandingBalance(membershipId);
        return new MemberContributionsView(items, outstanding, "XOF");
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
