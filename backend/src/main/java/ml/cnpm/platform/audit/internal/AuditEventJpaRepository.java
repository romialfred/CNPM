package ml.cnpm.platform.audit.internal;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Répertoire de lecture du journal métier immuable. */
interface AuditEventJpaRepository extends JpaRepository<AuditEventEntity, UUID> {}
