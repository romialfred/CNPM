package ml.cnpm.platform.audit.internal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Consultation strictement habilitée du journal métier. */
@Service
class AuditSearchService {

    private final AuditEventJpaRepository repository;

    AuditSearchService(AuditEventJpaRepository repository) {
        this.repository = repository;
    }

    @PreAuthorize("hasAuthority('PERM_AUDIT.READ')")
    @Transactional(readOnly = true)
    public Page<AuditEventEntity> search(int page, int size) {
        return repository.findAll(
                PageRequest.of(
                        page,
                        size,
                        Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))));
    }
}
