package ml.cnpm.platform.member.adapter.out.persistence;

import java.util.UUID;
import ml.cnpm.platform.member.application.port.out.MembershipHistoryRepository;
import ml.cnpm.platform.member.domain.MembershipStatusChange;
import ml.cnpm.platform.shared.api.PageResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

/**
 * Adaptateur de lecture de l'historique des statuts, sur la vue
 * {@code member.organization_status_history}.
 *
 * <p>Ordre du plus récent au plus ancien ({@code created_at} décroissant), départagé par
 * l'identifiant pour une pagination stable quand deux changements partagent l'horodatage.
 */
@Repository
class MembershipHistoryPersistenceAdapter implements MembershipHistoryRepository {

    private final OrganizationStatusHistoryJpaRepository jpaRepository;

    MembershipHistoryPersistenceAdapter(OrganizationStatusHistoryJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PageResult<MembershipStatusChange> findByOrganization(
            UUID organizationId, int page, int size) {
        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));
        Page<OrganizationStatusHistoryEntity> result =
                jpaRepository.findByOrganizationId(organizationId, pageable);
        return new PageResult<>(
                result.getContent().stream()
                        .map(MembershipHistoryPersistenceAdapter::toDomain)
                        .toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    private static MembershipStatusChange toDomain(OrganizationStatusHistoryEntity entity) {
        return new MembershipStatusChange(
                entity.getId(),
                entity.getMembershipId(),
                entity.getMembershipNumber(),
                entity.getFromStatus(),
                entity.getToStatus(),
                entity.getReason(),
                entity.getCreatedAt(),
                entity.getCreatedBy());
    }
}
