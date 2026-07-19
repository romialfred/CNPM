package ml.cnpm.platform.professionalgroup.adapter.in.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import ml.cnpm.platform.professionalgroup.application.ProfessionalGroupService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Adaptateur HTTP de {@code listProfessionalGroups}. */
@RestController
public class ProfessionalGroupController {

    private final ProfessionalGroupService service;

    public ProfessionalGroupController(ProfessionalGroupService service) {
        this.service = service;
    }

    @GetMapping("/professional-groups")
    public ProfessionalGroupPageView list(
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        return ProfessionalGroupPageView.from(service.list(page, size));
    }
}
