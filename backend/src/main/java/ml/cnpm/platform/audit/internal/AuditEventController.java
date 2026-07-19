package ml.cnpm.platform.audit.internal;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Adaptateur HTTP de {@code searchAuditEvents}; les filtres de période restent contractuellement absents. */
@RestController
public class AuditEventController {

    private final AuditSearchService service;

    public AuditEventController(AuditSearchService service) {
        this.service = service;
    }

    @GetMapping("/audit-events")
    public AuditEventPageView search(
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        return AuditEventPageView.from(service.search(page, size));
    }
}
