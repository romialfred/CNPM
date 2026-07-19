package ml.cnpm.platform.contribution.application.port.out;

import ml.cnpm.platform.contribution.domain.ContributionRule;
import ml.cnpm.platform.shared.api.PageResult;

/** Port sortant de lecture des versions de bareme. */
public interface ContributionRuleRepository {

    PageResult<ContributionRule> findAll(int page, int size);
}
