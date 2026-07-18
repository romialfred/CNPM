package ml.cnpm.platform.member.adapter.out.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Répertoire Spring Data d'écriture des adhésions (table de base, pas la vue de lecture). */
interface MembershipJpaRepository extends JpaRepository<MembershipEntity, UUID> {

    Optional<MembershipEntity> findByMembershipNumber(String membershipNumber);

    boolean existsByOrganizationIdAndStatus(UUID organizationId, String status);
}
