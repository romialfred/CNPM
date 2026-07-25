package ml.cnpm.platform.member.adapter.in.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import ml.cnpm.platform.member.application.MemberEventQueryService;
import ml.cnpm.platform.member.application.MemberEventView;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Espace membre — actualités et informations ({@code GET /portal/events}).
 *
 * <p>Liste les événements CNPM publiés. Taille de page bornée côté serveur.
 */
@RestController
public class MemberEventController {

    private final MemberEventQueryService service;

    public MemberEventController(MemberEventQueryService service) {
        this.service = service;
    }

    @GetMapping("/portal/events")
    public MemberEventView.Page list(
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        return service.list(page, size);
    }
}
