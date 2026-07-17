package ml.cnpm.platform.member.adapter.in.web;

import java.util.List;
import ml.cnpm.platform.member.domain.Organization;
import ml.cnpm.platform.shared.api.PageResult;

/**
 * Page typée renvoyée par {@code listOrganizations}, alignée sur le schéma
 * {@code OrganizationPage} du contrat.
 */
public record OrganizationPageView(
        List<OrganizationView> items, int page, int size, long totalElements, int totalPages) {

    static OrganizationPageView from(PageResult<Organization> result) {
        return new OrganizationPageView(
                result.items().stream().map(OrganizationView::from).toList(),
                result.page(),
                result.size(),
                result.totalElements(),
                result.totalPages());
    }
}
