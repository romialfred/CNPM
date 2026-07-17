package ml.cnpm.platform.member.adapter.out.persistence;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * Répertoire Spring Data interne à l'adaptateur.
 *
 * <p>{@code JpaSpecificationExecutor} permet des filtres dynamiques bornés et paginés,
 * sans multiplier les méthodes dérivées ni charger de collection non bornée
 * ({@code .claude/rules/backend-java.md}).
 */
interface OrganizationJpaRepository
        extends JpaRepository<OrganizationEntity, UUID>,
                JpaSpecificationExecutor<OrganizationEntity> {}
