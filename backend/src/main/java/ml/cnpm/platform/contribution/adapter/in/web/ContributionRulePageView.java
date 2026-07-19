package ml.cnpm.platform.contribution.adapter.in.web;

import java.util.List;
import ml.cnpm.platform.contribution.domain.ContributionRule;
import ml.cnpm.platform.shared.api.PageResult;

/** Collection paginee alignee sur {@code PageResource}. */
public record ContributionRulePageView(
        List<ContributionRuleView> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {

    static ContributionRulePageView from(PageResult<ContributionRule> result) {
        return new ContributionRulePageView(
                result.items().stream().map(ContributionRuleView::from).toList(),
                result.page(),
                result.size(),
                result.totalElements(),
                result.totalPages());
    }
}
