package ml.cnpm.platform.member.adapter.in.web;

import java.util.List;
import ml.cnpm.platform.member.domain.Membership;
import ml.cnpm.platform.shared.api.PageResult;

/** Page typée renvoyée par {@code listMemberships}, alignée sur le schéma {@code MembershipPage}. */
public record MembershipPageView(
        List<MembershipView> items, int page, int size, long totalElements, int totalPages) {

    static MembershipPageView from(PageResult<Membership> result) {
        return new MembershipPageView(
                result.items().stream().map(MembershipView::from).toList(),
                result.page(),
                result.size(),
                result.totalElements(),
                result.totalPages());
    }
}
