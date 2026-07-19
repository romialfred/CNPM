package ml.cnpm.platform.audit.internal;

import java.time.Instant;
import java.util.UUID;

/** Projection HTTP filtrée d'un événement d'audit. */
public record AuditEventView(
        UUID id,
        Instant createdAt,
        UUID actorUserId,
        String actorType,
        String actionCode,
        String entityType,
        UUID entityId,
        String beforeHash,
        String afterHash,
        UUID correlationId) {

    static AuditEventView from(AuditEventEntity entity) {
        return new AuditEventView(
                entity.getId(),
                entity.getCreatedAt(),
                entity.getActorUserId(),
                entity.getActorType(),
                entity.getActionCode(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getBeforeHash(),
                entity.getAfterHash(),
                entity.getCorrelationId());
    }
}
