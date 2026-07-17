package ml.cnpm.platform.member.adapter.out.persistence;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/** Répertoire Spring Data interne à l'adaptateur — filtres dynamiques bornés et paginés. */
interface MembershipJpaRepository
        extends JpaRepository<MembershipEntity, UUID>,
                JpaSpecificationExecutor<MembershipEntity> {}
