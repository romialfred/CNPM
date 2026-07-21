package ml.cnpm.platform.reporting.adapter.in.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import ml.cnpm.platform.reporting.application.DashboardQueryService;
import ml.cnpm.platform.reporting.application.DashboardView;

/**
 * Adaptateur HTTP du tableau de bord d'administration (BO-001 ; {@code GET /dashboards/{code}}).
 *
 * <p>{@code code} désigne l'exercice (année fiscale). L'habilitation est portée par le service.
 */
@RestController
public class DashboardController {

    private final DashboardQueryService service;

    public DashboardController(DashboardQueryService service) {
        this.service = service;
    }

    @GetMapping("/dashboards/{code}")
    public DashboardView dashboard(@PathVariable("code") String code) {
        return service.load(code);
    }
}
