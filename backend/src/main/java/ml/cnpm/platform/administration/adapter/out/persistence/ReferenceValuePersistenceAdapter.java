package ml.cnpm.platform.administration.adapter.out.persistence;

import ml.cnpm.platform.administration.application.PageResult;
import ml.cnpm.platform.administration.application.port.out.ReferenceValueRepository;
import ml.cnpm.platform.administration.domain.ReferenceValue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

/**
 * Adaptateur de persistance : implémente le port sortant avec Spring Data JPA et
 * traduit l'entité JPA vers le modèle de domaine.
 *
 * <p>L'ordre est stable et déterministe (domaine, puis rang d'affichage, puis code) :
 * une pagination sans tri garanti renverrait des pages incohérentes d'un appel à
 * l'autre.
 */
@Repository
class ReferenceValuePersistenceAdapter implements ReferenceValueRepository {

    private static final Sort STABLE_ORDER =
            Sort.by(Sort.Order.asc("domain"), Sort.Order.asc("sortOrder"), Sort.Order.asc("code"));

    private final ReferenceValueJpaRepository jpaRepository;

    ReferenceValuePersistenceAdapter(ReferenceValueJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PageResult<ReferenceValue> list(String domain, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, STABLE_ORDER);
        Page<ReferenceValueEntity> result =
                (domain == null || domain.isBlank())
                        ? jpaRepository.findAll(pageable)
                        : jpaRepository.findByDomain(domain, pageable);
        return new PageResult<>(
                result.getContent().stream().map(ReferenceValuePersistenceAdapter::toDomain).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    private static ReferenceValue toDomain(ReferenceValueEntity entity) {
        return new ReferenceValue(
                entity.getId(),
                entity.getDomain(),
                entity.getCode(),
                entity.getLabel(),
                entity.getSortOrder(),
                entity.isActive(),
                entity.getValidFrom(),
                entity.getValidTo());
    }
}
