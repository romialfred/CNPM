package ml.cnpm.platform.integration.application;

import ml.cnpm.platform.integration.application.port.out.IntegrationPartnerRepository;
import ml.cnpm.platform.integration.domain.IntegrationPartner;
import ml.cnpm.platform.shared.api.PageResult;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Cas d'usage de supervision en lecture seule des partenaires externes. */
@Service
public class IntegrationPartnerService {

    private final IntegrationPartnerRepository repository;

    public IntegrationPartnerService(IntegrationPartnerRepository repository) {
        this.repository = repository;
    }

    @PreAuthorize("hasAuthority('PERM_OPS.MONITOR.READ')")
    @Transactional(readOnly = true)
    public PageResult<IntegrationPartner> list(int page, int size) {
        return repository.findAll(page, size);
    }
}
