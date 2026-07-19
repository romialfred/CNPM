package ml.cnpm.platform.recovery.adapter.in.web;

import java.util.List;
import ml.cnpm.platform.recovery.domain.CollectionCampaign;
import ml.cnpm.platform.shared.api.PageResult;

/** Collection paginee alignee sur {@code PageResource}. */
public record CollectionCampaignPageView(
        List<CollectionCampaignView> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {

    static CollectionCampaignPageView from(PageResult<CollectionCampaign> result) {
        return new CollectionCampaignPageView(
                result.items().stream().map(CollectionCampaignView::from).toList(),
                result.page(),
                result.size(),
                result.totalElements(),
                result.totalPages());
    }
}
