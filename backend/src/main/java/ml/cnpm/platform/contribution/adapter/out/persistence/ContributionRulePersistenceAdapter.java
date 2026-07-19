package ml.cnpm.platform.contribution.adapter.out.persistence;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import ml.cnpm.platform.contribution.application.port.out.ContributionRuleRepository;
import ml.cnpm.platform.contribution.domain.ContributionRule;
import ml.cnpm.platform.shared.api.PageResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

/** Adaptateur PostgreSQL de lecture paginee des baremes. */
@Repository
class ContributionRulePersistenceAdapter implements ContributionRuleRepository {

    private final ContributionRuleJpaRepository repository;

    ContributionRulePersistenceAdapter(ContributionRuleJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public PageResult<ContributionRule> findAll(int page, int size) {
        Page<ContributionRuleEntity> result =
                repository.findAll(
                        PageRequest.of(
                                page,
                                size,
                                Sort.by(
                                        Sort.Order.desc("validFrom"),
                                        Sort.Order.asc("ruleCode"),
                                        Sort.Order.asc("id"))));
        return new PageResult<>(
                result.getContent().stream()
                        .map(ContributionRulePersistenceAdapter::toDomain)
                        .toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    private static ContributionRule toDomain(ContributionRuleEntity entity) {
        Map<String, Object> parameters = entity.getParameters();
        return new ContributionRule(
                entity.getId(),
                entity.getRuleCode(),
                entity.getCategoryCode(),
                entity.getCalculationMethod(),
                parameters == null
                        ? Map.of()
                        : Collections.unmodifiableMap(new LinkedHashMap<>(parameters)),
                entity.getValidFrom(),
                entity.getValidTo(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getCreatedBy(),
                entity.getUpdatedAt(),
                entity.getVersion());
    }
}
