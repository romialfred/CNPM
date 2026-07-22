package ml.cnpm.platform.reporting.adapter.in.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import ml.cnpm.platform.reporting.application.MemberDetailQueryService;
import ml.cnpm.platform.reporting.application.MemberDetailView;

/**
 * Adaptateur HTTP de la fiche membre 360° (BO-003 ;
 * {@code GET /organizations/{id}/member-detail}). {@code id} est l'identifiant d'organisation.
 * L'habilitation est portée par le service ; l'organisation inconnue produit un 404.
 */
@RestController
public class MemberDetailController {

    private final MemberDetailQueryService service;

    public MemberDetailController(MemberDetailQueryService service) {
        this.service = service;
    }

    @GetMapping("/organizations/{id}/member-detail")
    public MemberDetailView memberDetail(@PathVariable("id") String id) {
        return service.load(id);
    }
}
