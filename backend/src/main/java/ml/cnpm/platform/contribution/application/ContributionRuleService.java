package ml.cnpm.platform.contribution.application;

import ml.cnpm.platform.contribution.application.port.out.ContributionRuleRepository;
import ml.cnpm.platform.contribution.domain.ContributionRule;
import ml.cnpm.platform.shared.api.PageResult;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Consultation seule des baremes versionnes. */
@Service
public class ContributionRuleService {

    private final ContributionRuleRepository repository;

    public ContributionRuleService(ContributionRuleRepository repository) {
        this.repository = repository;
    }

    @PreAuthorize("hasAuthority('PERM_CONTRIBUTION.READ')")
    @Transactional(readOnly = true)
    public PageResult<ContributionRule> list(int page, int size) {
        return repository.findAll(page, size);
    }
}
