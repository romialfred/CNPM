package ml.cnpm.platform.recovery.application;

import ml.cnpm.platform.recovery.application.port.out.CollectionCampaignRepository;
import ml.cnpm.platform.recovery.domain.CollectionCampaign;
import ml.cnpm.platform.shared.api.PageResult;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Consultation seule des campagnes de recouvrement. */
@Service
public class CollectionCampaignService {

    private final CollectionCampaignRepository repository;

    public CollectionCampaignService(CollectionCampaignRepository repository) {
        this.repository = repository;
    }

    @PreAuthorize("hasAuthority('PERM_RECOVERY.READ')")
    @Transactional(readOnly = true)
    public PageResult<CollectionCampaign> list(int page, int size) {
        return repository.findAll(page, size);
    }
}
