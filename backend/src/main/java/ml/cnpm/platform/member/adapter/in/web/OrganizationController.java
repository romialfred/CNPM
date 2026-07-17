package ml.cnpm.platform.member.adapter.in.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import ml.cnpm.platform.member.application.OrganizationCreation;
import ml.cnpm.platform.member.application.OrganizationQuery;
import ml.cnpm.platform.member.application.OrganizationService;
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
 * Adaptateur entrant HTTP du module MEMBER — {@code GET /organizations}
 * ({@code listOrganizations}).
 *
 * <p>Le contrôleur ne porte ni règle métier ni décision d'autorisation : il valide la
 * forme des entrées au bord du système, délègue au service (qui porte le
 * {@code @PreAuthorize}) et projette le résultat. La taille de page est bornée côté
 * serveur ({@code .claude/rules/api.md}).
 */
@RestController
public class OrganizationController {

    private final OrganizationService service;

    public OrganizationController(OrganizationService service) {
        this.service = service;
    }

    @GetMapping("/organizations")
    public OrganizationPageView list(
            @RequestParam(name = "status", required = false) @Size(max = 30) String status,
            @RequestParam(name = "organizationType", required = false) @Size(max = 40) String organizationType,
            @RequestParam(name = "sectorCode", required = false) @Size(max = 80) String sectorCode,
            @RequestParam(name = "search", required = false) @Size(max = 120) String search,
            @RequestParam(name = "sort", required = false) @Size(max = 40) String sort,
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        OrganizationQuery query =
                new OrganizationQuery(status, organizationType, sectorCode, search, sort, page, size);
        return OrganizationPageView.from(service.search(query));
    }

    /**
     * {@code GET /organizations/{id}} — fiche d'une entreprise. Un identifiant mal formé
     * échoue à la conversion {@code UUID} et produit un 400 normalisé ; une entreprise
     * absente produit un 404 {@code Problem} (levé par le service).
     */
    /**
     * {@code POST /organizations} — crée une entreprise. Idempotent sur l'identifiant métier :
     * 201 pour une création réelle, 200 pour un rejeu d'une entreprise identique, 409 si
     * l'identifiant est pris par une entreprise différente. L'en-tête {@code Idempotency-Key}
     * est exigé (400 sinon), conformément au contrat.
     */
    @PostMapping("/organizations")
    public ResponseEntity<OrganizationView> create(
            @RequestHeader(name = "Idempotency-Key") @Size(min = 16, max = 100) String idempotencyKey,
            @Valid @RequestBody OrganizationInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        OrganizationCreation outcome =
                service.create(input.toDraft(), actorId(authentication), CorrelationId.current(request));
        OrganizationView view = OrganizationView.from(outcome.value());
        return ResponseEntity.status(outcome.created() ? HttpStatus.CREATED : HttpStatus.OK)
                .body(view);
    }

    @GetMapping("/organizations/{id}")
    public OrganizationView get(@PathVariable("id") UUID id) {
        return OrganizationView.from(service.get(id));
    }

    /**
     * {@code PATCH /organizations/{id}} — modification partielle des champs descriptifs, sous
     * verrou optimiste. L'en-tête {@code If-Match} porte la version connue du client ; un
     * écart avec la version courante produit un 409. 404 si l'entreprise est absente.
     */
    @PatchMapping("/organizations/{id}")
    public OrganizationView update(
            @PathVariable("id") UUID id,
            @RequestHeader(name = "If-Match") long expectedVersion,
            @Valid @RequestBody OrganizationUpdateInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return OrganizationView.from(
                service.update(
                        id,
                        expectedVersion,
                        input.toPatch(),
                        actorId(authentication),
                        CorrelationId.current(request)));
    }

    /**
     * Identifiant de l'acteur pour l'audit : le sujet du jeton s'il est un UUID (cas
     * Keycloak), {@code null} sinon — l'audit préfère un acteur absent à un acteur fabriqué.
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

    /**
     * {@code GET /organizations/{id}/history} — historique paginé des changements de statut
     * des adhésions de l'entreprise, du plus récent au plus ancien. 404 si l'entreprise est
     * absente ; taille de page bornée côté serveur.
     */
    @GetMapping("/organizations/{id}/history")
    public OrganizationHistoryPageView history(
            @PathVariable("id") UUID id,
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        return OrganizationHistoryPageView.from(service.getHistory(id, page, size));
    }
}
