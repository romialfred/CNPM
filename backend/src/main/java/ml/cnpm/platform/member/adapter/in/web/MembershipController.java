package ml.cnpm.platform.member.adapter.in.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import ml.cnpm.platform.member.application.MembershipQuery;
import ml.cnpm.platform.member.application.MembershipService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Adaptateur entrant HTTP du module MEMBER — {@code GET /memberships}
 * ({@code listMemberships}). C'est la vue « membre » de BO-002.
 *
 * <p>Le contrôleur valide la forme des entrées et délègue au service (qui porte le
 * {@code @PreAuthorize}). Taille de page bornée côté serveur.
 */
@RestController
public class MembershipController {

    private final MembershipService service;

    public MembershipController(MembershipService service) {
        this.service = service;
    }

    @GetMapping("/memberships")
    public MembershipPageView list(
            @RequestParam(name = "status", required = false) @Size(max = 30) String status,
            @RequestParam(name = "categoryCode", required = false) @Size(max = 50) String categoryCode,
            @RequestParam(name = "groupCode", required = false) @Size(max = 60) String groupCode,
            @RequestParam(name = "search", required = false) @Size(max = 120) String search,
            @RequestParam(name = "sort", required = false) @Size(max = 40) String sort,
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        MembershipQuery query =
                new MembershipQuery(status, categoryCode, groupCode, search, sort, page, size);
        return MembershipPageView.from(service.search(query));
    }
}
