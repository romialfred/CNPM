package ml.cnpm.platform.member.adapter.in.web;

import java.util.List;
import ml.cnpm.platform.member.domain.MembershipStatusChange;
import ml.cnpm.platform.shared.api.PageResult;

/**
 * Page typée renvoyée par {@code getOrganizationHistory}, alignée sur le schéma
 * {@code OrganizationHistoryPage}.
 */
public record OrganizationHistoryPageView(
        List<MembershipStatusChangeView> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {

    static OrganizationHistoryPageView from(PageResult<MembershipStatusChange> result) {
        return new OrganizationHistoryPageView(
                result.items().stream().map(MembershipStatusChangeView::from).toList(),
                result.page(),
                result.size(),
                result.totalElements(),
                result.totalPages());
    }
}
