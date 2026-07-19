package ml.cnpm.platform.professionalgroup.adapter.out.persistence;

import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.professionalgroup.application.port.out.ProfessionalGroupRepository;
import ml.cnpm.platform.professionalgroup.domain.ProfessionalGroup;
import ml.cnpm.platform.shared.api.PageResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

/** Adaptateur PostgreSQL de lecture paginée des groupements. */
@Repository
class ProfessionalGroupPersistenceAdapter implements ProfessionalGroupRepository {

    private final ProfessionalGroupJpaRepository repository;

    ProfessionalGroupPersistenceAdapter(ProfessionalGroupJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public PageResult<ProfessionalGroup> findAll(int page, int size) {
        Page<ProfessionalGroupEntity> result =
                repository.findAll(
                        PageRequest.of(
                                page,
                                size,
                                Sort.by(Sort.Order.asc("code"), Sort.Order.asc("id"))));
        return new PageResult<>(
                result.getContent().stream().map(ProfessionalGroupPersistenceAdapter::toDomain).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    @Override
    public Optional<ProfessionalGroup> findById(UUID id) {
        return repository.findById(id).map(ProfessionalGroupPersistenceAdapter::toDomain);
    }

    private static ProfessionalGroup toDomain(ProfessionalGroupEntity entity) {
        return new ProfessionalGroup(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getSectorCode(),
                entity.getStatus(),
                entity.getVersion());
    }
}
