package ml.cnpm.platform.reporting.adapter.in.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import ml.cnpm.platform.reporting.application.MemberOverviewService;
import ml.cnpm.platform.reporting.application.MemberOverviewView;

/**
 * Adaptateur HTTP de la synthèse du répertoire des membres (BO-002 ;
 * {@code GET /reporting/member-overview}) : volet de synthèse, options de filtre et agrégats
 * financiers par organisation. Habilitation portée par le service.
 */
@RestController
public class MemberOverviewController {

    private final MemberOverviewService service;

    public MemberOverviewController(MemberOverviewService service) {
        this.service = service;
    }

    @GetMapping("/reporting/member-overview")
    public MemberOverviewView memberOverview() {
        return service.load();
    }
}
