package ml.cnpm.platform.administration.adapter.in.web;

import java.util.List;
import ml.cnpm.platform.shared.api.PageResult;
import ml.cnpm.platform.administration.domain.ReferenceValue;

/**
 * Page typée renvoyée par {@code listReferenceValues}, alignée sur le schéma
 * {@code ReferenceValuePage} du contrat OpenAPI.
 */
public record ReferenceValuePageView(
        List<ReferenceValueView> items, int page, int size, long totalElements, int totalPages) {

    static ReferenceValuePageView from(PageResult<ReferenceValue> result) {
        return new ReferenceValuePageView(
                result.items().stream().map(ReferenceValueView::from).toList(),
                result.page(),
                result.size(),
                result.totalElements(),
                result.totalPages());
    }
}
