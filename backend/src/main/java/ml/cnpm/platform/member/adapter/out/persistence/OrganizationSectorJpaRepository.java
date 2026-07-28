package ml.cnpm.platform.member.adapter.out.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Répertoire Spring Data des secteurs multi-valués d'une entreprise (table de liaison). */
interface OrganizationSectorJpaRepository
        extends JpaRepository<OrganizationSectorEntity, OrganizationSectorEntity.Key> {

    List<OrganizationSectorEntity> findByOrganizationId(UUID organizationId);
}
