package ml.cnpm.platform.enrollment.adapter.in.web;

import java.util.List;
import ml.cnpm.platform.enrollment.domain.EnrollmentCase;
import ml.cnpm.platform.shared.api.PageResult;

/** Page typée de dossiers d'adhésion, alignée sur {@code EnrollmentApplicationPage}. */
public record EnrollmentApplicationPageView(
        List<EnrollmentApplicationView> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {

    static EnrollmentApplicationPageView from(PageResult<EnrollmentCase> result) {
        return new EnrollmentApplicationPageView(
                result.items().stream().map(EnrollmentApplicationView::from).toList(),
                result.page(),
                result.size(),
                result.totalElements(),
                result.totalPages());
    }
}
