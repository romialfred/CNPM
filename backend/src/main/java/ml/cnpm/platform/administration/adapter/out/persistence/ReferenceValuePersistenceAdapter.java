package ml.cnpm.platform.administration.adapter.out.persistence;

import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.shared.api.PageResult;
import ml.cnpm.platform.administration.application.ReferenceValueDraft;
import ml.cnpm.platform.administration.application.ReferenceValuePatch;
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

    @Override
    public Optional<ReferenceValue> findByDomainAndCode(String domain, String code) {
        return jpaRepository.findByDomainAndCode(domain, code).map(ReferenceValuePersistenceAdapter::toDomain);
    }

    @Override
    public ReferenceValue create(ReferenceValueDraft draft) {
        // L'identifiant est assigné avant persistance : `save` sur une entité neuve
        // effectue une insertion, et la valeur renvoyée porte l'identifiant retenu.
        ReferenceValueEntity entity =
                new ReferenceValueEntity(
                        UUID.randomUUID(),
                        draft.domain(),
                        draft.code(),
                        draft.label(),
                        draft.sortOrder(),
                        draft.active());
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public Optional<ReferenceValue> findById(UUID id) {
        return jpaRepository.findById(id).map(ReferenceValuePersistenceAdapter::toDomain);
    }

    @Override
    public ReferenceValue update(UUID id, ReferenceValuePatch patch) {
        // On charge l'entité gérée, on applique la modification, et le flush déclenche le
        // contrôle de version JPA (@Version) : une modification concurrente survenue
        // entre-temps lève une exception de verrou optimiste, traduite en 409 plus haut.
        ReferenceValueEntity entity =
                jpaRepository
                        .findById(id)
                        .orElseThrow(() -> new NoSuchElementException("reference value " + id));
        if (patch.label() != null) {
            entity.applyLabel(patch.label());
        }
        if (patch.sortOrder() != null) {
            entity.applySortOrder(patch.sortOrder());
        }
        if (patch.active() != null) {
            entity.applyActive(patch.active());
        }
        return toDomain(jpaRepository.saveAndFlush(entity));
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
                entity.getValidTo(),
                entity.getVersion());
    }
}
