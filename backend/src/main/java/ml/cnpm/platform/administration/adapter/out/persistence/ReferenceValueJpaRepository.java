package ml.cnpm.platform.administration.adapter.out.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Répertoire Spring Data interne à l'adaptateur de persistance.
 *
 * <p>Toutes les lectures sont paginées : {@code .claude/rules/backend-java.md} interdit
 * tout chargement non borné, aussi n'expose-t-on aucune méthode retournant une
 * collection entière.
 */
interface ReferenceValueJpaRepository extends JpaRepository<ReferenceValueEntity, UUID> {

    Page<ReferenceValueEntity> findByDomain(String domain, Pageable pageable);

    Optional<ReferenceValueEntity> findByDomainAndCode(String domain, String code);
}
