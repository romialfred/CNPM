package ml.cnpm.platform.administration.adapter.in.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import ml.cnpm.platform.administration.application.AdminSecurityQueryService;
import ml.cnpm.platform.administration.application.AdminSecurityView;

/**
 * Adaptateur HTTP de l'écran « Administration et sécurité »
 * ({@code GET /admin/security/snapshot}). Habilitation portée par le service ; lecture seule.
 */
@RestController
public class AdminSecurityController {

    private final AdminSecurityQueryService service;

    public AdminSecurityController(AdminSecurityQueryService service) {
        this.service = service;
    }

    @GetMapping("/admin/security/snapshot")
    public AdminSecurityView snapshot() {
        return service.load();
    }
}
