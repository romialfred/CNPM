package ml.cnpm.platform.integration.adapter.out.persistence;

import ml.cnpm.platform.integration.application.port.out.IntegrationPartnerRepository;
import ml.cnpm.platform.integration.domain.IntegrationPartner;
import ml.cnpm.platform.shared.api.PageResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

/** Adaptateur PostgreSQL de lecture paginee des partenaires. */
@Repository
class IntegrationPartnerPersistenceAdapter implements IntegrationPartnerRepository {

    private final IntegrationPartnerJpaRepository repository;

    IntegrationPartnerPersistenceAdapter(IntegrationPartnerJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public PageResult<IntegrationPartner> findAll(int page, int size) {
        Page<IntegrationPartnerEntity> result =
                repository.findAll(
                        PageRequest.of(
                                page,
                                size,
                                Sort.by(
                                        Sort.Order.asc("partnerCode"),
                                        Sort.Order.asc("id"))));
        return new PageResult<>(
                result.getContent().stream()
                        .map(IntegrationPartnerPersistenceAdapter::toDomain)
                        .toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    private static IntegrationPartner toDomain(IntegrationPartnerEntity entity) {
        return new IntegrationPartner(
                entity.getId(),
                entity.getPartnerCode(),
                entity.getName(),
                entity.getPartnerType(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getCreatedBy(),
                entity.getUpdatedAt(),
                entity.getVersion());
    }
}
