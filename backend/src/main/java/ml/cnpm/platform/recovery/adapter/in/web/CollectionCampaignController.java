package ml.cnpm.platform.recovery.adapter.in.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import ml.cnpm.platform.recovery.application.CollectionCampaignService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Adaptateur HTTP de {@code listCollectionCampaigns}. */
@RestController
public class CollectionCampaignController {

    private final CollectionCampaignService service;

    public CollectionCampaignController(CollectionCampaignService service) {
        this.service = service;
    }

    @GetMapping("/collection-campaigns")
    public CollectionCampaignPageView list(
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        return CollectionCampaignPageView.from(service.list(page, size));
    }
}
