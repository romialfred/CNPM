package ml.cnpm.platform.contribution.adapter.in.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import ml.cnpm.platform.contribution.application.ContributionRuleService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Adaptateur HTTP de {@code listContributionRules}. */
@RestController
public class ContributionRuleController {

    private final ContributionRuleService service;

    public ContributionRuleController(ContributionRuleService service) {
        this.service = service;
    }

    @GetMapping("/contribution-rules")
    public ContributionRulePageView list(
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        return ContributionRulePageView.from(service.list(page, size));
    }
}
