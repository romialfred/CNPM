package ml.cnpm.platform.member.adapter.out.persistence;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/** Répertoire Spring Data en lecture seule sur la vue {@code member.organization_status_history}. */
interface OrganizationStatusHistoryJpaRepository
        extends JpaRepository<OrganizationStatusHistoryEntity, UUID> {

    Page<OrganizationStatusHistoryEntity> findByOrganizationId(UUID organizationId, Pageable pageable);
}
