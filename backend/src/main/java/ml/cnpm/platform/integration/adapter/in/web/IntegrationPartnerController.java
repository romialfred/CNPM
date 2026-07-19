package ml.cnpm.platform.integration.adapter.in.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import ml.cnpm.platform.integration.application.IntegrationPartnerService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Adaptateur HTTP de {@code listIntegrationPartners}. */
@RestController
public class IntegrationPartnerController {

    private final IntegrationPartnerService service;

    public IntegrationPartnerController(IntegrationPartnerService service) {
        this.service = service;
    }

    @GetMapping("/integration-partners")
    public IntegrationPartnerPageView list(
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        return IntegrationPartnerPageView.from(service.list(page, size));
    }
}
