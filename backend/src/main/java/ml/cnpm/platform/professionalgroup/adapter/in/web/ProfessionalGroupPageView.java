package ml.cnpm.platform.professionalgroup.adapter.in.web;

import java.util.List;
import ml.cnpm.platform.professionalgroup.domain.ProfessionalGroup;
import ml.cnpm.platform.shared.api.PageResult;

/** Page typée alignée sur {@code ProfessionalGroupPage}. */
public record ProfessionalGroupPageView(
        List<ProfessionalGroupView> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {

    static ProfessionalGroupPageView from(PageResult<ProfessionalGroup> result) {
        return new ProfessionalGroupPageView(
                result.items().stream().map(ProfessionalGroupView::from).toList(),
                result.page(),
                result.size(),
                result.totalElements(),
                result.totalPages());
    }
}
