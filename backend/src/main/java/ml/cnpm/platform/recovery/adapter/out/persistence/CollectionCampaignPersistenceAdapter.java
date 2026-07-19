package ml.cnpm.platform.recovery.adapter.out.persistence;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import ml.cnpm.platform.recovery.application.port.out.CollectionCampaignRepository;
import ml.cnpm.platform.recovery.domain.CollectionCampaign;
import ml.cnpm.platform.shared.api.PageResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

/** Adaptateur PostgreSQL de lecture paginee des campagnes de recouvrement. */
@Repository
class CollectionCampaignPersistenceAdapter implements CollectionCampaignRepository {

    private final CollectionCampaignJpaRepository repository;

    CollectionCampaignPersistenceAdapter(CollectionCampaignJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public PageResult<CollectionCampaign> findAll(int page, int size) {
        Page<CollectionCampaignEntity> result =
                repository.findAll(
                        PageRequest.of(
                                page,
                                size,
                                Sort.by(
                                        Sort.Order.desc("startAt"),
                                        Sort.Order.asc("campaignCode"),
                                        Sort.Order.asc("id"))));
        return new PageResult<>(
                result.getContent().stream()
                        .map(CollectionCampaignPersistenceAdapter::toDomain)
                        .toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    private static CollectionCampaign toDomain(CollectionCampaignEntity entity) {
        Map<String, Object> targetSegment = entity.getTargetSegment();
        return new CollectionCampaign(
                entity.getId(),
                entity.getCampaignCode(),
                entity.getName(),
                targetSegment == null
                        ? Map.of()
                        : Collections.unmodifiableMap(new LinkedHashMap<>(targetSegment)),
                entity.getStartAt(),
                entity.getEndAt(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getCreatedBy(),
                entity.getUpdatedAt(),
                entity.getVersion());
    }
}
