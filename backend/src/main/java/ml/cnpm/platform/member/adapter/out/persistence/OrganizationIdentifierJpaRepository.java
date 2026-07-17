package ml.cnpm.platform.member.adapter.out.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Répertoire Spring Data de l'identifiant métier — support de la clé naturelle d'idempotence. */
interface OrganizationIdentifierJpaRepository
        extends JpaRepository<OrganizationIdentifierEntity, UUID> {

    Optional<OrganizationIdentifierEntity> findByIdentifierTypeAndIdentifierValue(
            String identifierType, String identifierValue);
}
