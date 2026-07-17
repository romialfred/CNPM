package ml.cnpm.platform.member.adapter.out.persistence;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * Répertoire Spring Data en lecture seule sur la vue {@code member.membership_list} :
 * filtres dynamiques bornés, tri en liste blanche, pagination sans N+1.
 */
interface MembershipListJpaRepository
        extends JpaRepository<MembershipListEntity, UUID>,
                JpaSpecificationExecutor<MembershipListEntity> {}
