package ml.cnpm.platform.administration.adapter.in.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import ml.cnpm.platform.administration.application.ReferenceValueService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Adaptateur entrant HTTP du module ADM — {@code GET /reference-values}
 * ({@code listReferenceValues}).
 *
 * <p>Le contrôleur ne porte aucune règle métier ni décision d'autorisation : il valide
 * la forme des entrées au bord du système, délègue au service applicatif (qui porte le
 * {@code @PreAuthorize}) et projette le résultat vers le DTO du contrat. La taille de
 * page est bornée côté serveur, comme l'exige {@code .claude/rules/api.md}.
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
}
