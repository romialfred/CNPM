package ml.cnpm.platform.member.adapter.out.persistence;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.member.application.port.out.MembershipActivationRepository;
import ml.cnpm.platform.member.domain.Membership;
import org.springframework.stereotype.Repository;

/**
 * Adaptateur d'écriture des adhésions.
 *
 * <p>L'historique de statut est une table en ajout seul : il est écrit par {@code persist}
 * (insertion pure, sans SELECT préalable), comme le journal d'audit.
 */
@Repository
class MembershipActivationPersistenceAdapter implements MembershipActivationRepository {

    private static final String STATUS_ACTIVE = "ACTIVE";

    private final MembershipJpaRepository jpaRepository;

    @PersistenceContext private EntityManager entityManager;

    MembershipActivationPersistenceAdapter(MembershipJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<Membership> findByMembershipNumber(String membershipNumber) {
        return jpaRepository
                .findByMembershipNumber(membershipNumber)
                .map(MembershipActivationPersistenceAdapter::toDomain);
    }

    @Override
    public boolean hasActiveMembership(UUID organizationId) {
        return jpaRepository.existsByOrganizationIdAndStatus(organizationId, STATUS_ACTIVE);
    }

    @Override
    public Membership activate(
            UUID organizationId,
            String membershipNumber,
            String categoryCode,
            String reason,
            UUID actorUserId) {
        UUID membershipId = UUID.randomUUID();
        MembershipEntity saved =
                jpaRepository.save(
                        new MembershipEntity(
                                membershipId,
                                organizationId,
                                membershipNumber,
                                categoryCode,
                                STATUS_ACTIVE,
                                LocalDate.now(),
                                Instant.now()));
        // Statut initial : pas d'état précédent (from_status nul).
        entityManager.persist(
                new MembershipStatusHistoryEntity(
                        UUID.randomUUID(), membershipId, null, STATUS_ACTIVE, reason, actorUserId));
        return toDomain(saved);
    }

    /**
     * Projection minimale : l'activation ne connaît ni le groupement ni le contact, résolus par
     * la vue de lecture BO-002.
     */
    private static Membership toDomain(MembershipEntity entity) {
        return new Membership(
                entity.getId(),
                entity.getMembershipNumber(),
                entity.getOrganizationId(),
                null,
                entity.getCategoryCode(),
                entity.getStatus(),
                entity.getJoinedAt(),
                entity.getVersion(),
                null,
                null,
                null,
                null,
                null);
    }
}
