package ml.cnpm.platform.reporting.adapter.in.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import ml.cnpm.platform.reporting.application.PublicHighlightsService;
import ml.cnpm.platform.reporting.application.PublicHighlightsView;

/**
 * Adaptateur HTTP public des chiffres clés de l'accueil (PUB-001 ; {@code GET /public/highlights}).
 *
 * <p>Endpoint anonyme (déclaré public dans {@code SecurityConfig}) : ne renvoie que des
 * dénombrements agrégés, jamais de donnée nominative.
 */
@RestController
public class PublicHighlightsController {

    private final PublicHighlightsService service;

    public PublicHighlightsController(PublicHighlightsService service) {
        this.service = service;
    }

    @GetMapping("/public/highlights")
    public PublicHighlightsView highlights() {
        return service.load();
    }
}
