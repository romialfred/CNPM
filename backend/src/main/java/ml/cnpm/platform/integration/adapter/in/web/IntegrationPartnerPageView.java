package ml.cnpm.platform.integration.adapter.in.web;

import java.util.List;
import ml.cnpm.platform.integration.domain.IntegrationPartner;
import ml.cnpm.platform.shared.api.PageResult;

/** Collection paginee alignee sur {@code PageResource}. */
public record IntegrationPartnerPageView(
        List<IntegrationPartnerView> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {

    static IntegrationPartnerPageView from(PageResult<IntegrationPartner> result) {
        return new IntegrationPartnerPageView(
                result.items().stream().map(IntegrationPartnerView::from).toList(),
                result.page(),
                result.size(),
                result.totalElements(),
                result.totalPages());
    }
}
