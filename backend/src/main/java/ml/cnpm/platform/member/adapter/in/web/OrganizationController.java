package ml.cnpm.platform.member.adapter.in.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import ml.cnpm.platform.member.application.OrganizationQuery;
import ml.cnpm.platform.member.application.OrganizationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
    @GetMapping("/organizations/{id}")
    public OrganizationView get(@PathVariable("id") UUID id) {
        return OrganizationView.from(service.get(id));
    }
}
