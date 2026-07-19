package ml.cnpm.platform.audit.internal;

import java.util.List;
import org.springframework.data.domain.Page;

/** Page d'événements d'audit alignée sur le contrat canonique. */
public record AuditEventPageView(
        List<AuditEventView> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {

    static AuditEventPageView from(Page<AuditEventEntity> result) {
        return new AuditEventPageView(
                result.getContent().stream().map(AuditEventView::from).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }
}
