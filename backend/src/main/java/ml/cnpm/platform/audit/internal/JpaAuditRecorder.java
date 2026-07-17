package ml.cnpm.platform.audit.internal;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import org.springframework.stereotype.Component;

/**
 * Enregistre l'événement d'audit via {@code EntityManager.persist} — une insertion
 * pure, sans {@code SELECT} préalable, adaptée à un journal en ajout seul.
 *
 * <p>L'appel s'exécute dans la transaction du service appelant : l'événement et l'action
 * métier sont validés ou annulés ensemble.
 */
@Component
class JpaAuditRecorder implements AuditRecorder {

    @PersistenceContext private EntityManager entityManager;

    @Override
    public void record(AuditEntry entry) {
        AuditEventEntity event =
                new AuditEventEntity(
                        UUID.randomUUID(),
                        entry.actorUserId(),
                        entry.actorType(),
                        entry.actionCode(),
                        entry.entityType(),
                        entry.entityId(),
                        entry.beforeHash(),
                        entry.afterHash(),
                        entry.correlationId());
        entityManager.persist(event);
    }
}
