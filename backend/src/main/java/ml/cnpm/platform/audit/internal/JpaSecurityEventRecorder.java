package ml.cnpm.platform.audit.internal;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.UUID;
import ml.cnpm.platform.audit.SecurityEvent;
import ml.cnpm.platform.audit.SecurityEventRecorder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Consigne un événement de sécurité dans sa propre transaction.
 *
 * <p>{@code REQUIRES_NEW} : un refus d'autorisation est journalisé indépendamment de
 * tout contexte transactionnel appelant — l'événement de sécurité doit persister même
 * si l'action refusée n'a, par définition, ouvert aucune transaction métier.
 */
@Component
class JpaSecurityEventRecorder implements SecurityEventRecorder {

    @PersistenceContext private EntityManager entityManager;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(SecurityEvent event) {
        entityManager.persist(
                new SecurityEventEntity(
                        UUID.randomUUID(), event.userId(), event.eventType(), event.severity()));
    }
}
