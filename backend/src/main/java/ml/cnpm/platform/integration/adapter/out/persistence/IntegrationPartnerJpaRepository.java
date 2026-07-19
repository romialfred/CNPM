package ml.cnpm.platform.integration.adapter.out.persistence;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Repertoire Spring Data interne du module INTEGRATION. */
interface IntegrationPartnerJpaRepository
        extends JpaRepository<IntegrationPartnerEntity, UUID> {}
