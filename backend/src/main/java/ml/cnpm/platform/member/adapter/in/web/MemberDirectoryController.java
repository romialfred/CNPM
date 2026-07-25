package ml.cnpm.platform.member.adapter.in.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import ml.cnpm.platform.member.application.MemberDirectoryQueryService;
import ml.cnpm.platform.member.application.MemberDirectoryView;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Espace membre — annuaire des organisations membres ({@code GET /portal/directory}).
 *
 * <p>Consultatif et non nominatif. Taille de page bornée côté serveur ; la recherche est un simple
 * filtre de nom, jamais un fragment SQL.
 */
@RestController
public class MemberDirectoryController {

    private final MemberDirectoryQueryService service;

    public MemberDirectoryController(MemberDirectoryQueryService service) {
        this.service = service;
    }

    @GetMapping("/portal/directory")
    public MemberDirectoryView.Page list(
            @RequestParam(name = "search", required = false) @Size(max = 120) String search,
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        return service.list(search, page, size);
    }
}
