package ml.cnpm.platform.contribution.adapter.out.persistence;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface ContributionRuleJpaRepository extends JpaRepository<ContributionRuleEntity, UUID> {}
