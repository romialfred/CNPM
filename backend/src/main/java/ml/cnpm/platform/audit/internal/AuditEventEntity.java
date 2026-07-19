package ml.cnpm.platform.audit.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Projection JPA de {@code audit.audit_event}, interne au module AUDIT.
 *
 * <p>Aucun {@code @Version} : la table est en ajout seul, jamais mise à jour, donc le
 * verrou optimiste n'a pas de sens. Les colonnes {@code created_at}, {@code metadata} et
 * les colonnes d'acteur technique portent des valeurs par défaut en base et ne sont pas
 * mappées ; {@code ddl-auto: validate} ne contrôle que les colonnes mappées.
 */
@Entity
@Table(name = "audit_event", schema = "audit")
class AuditEventEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "actor_user_id")
    private UUID actorUserId;

    @Column(name = "actor_type", nullable = false, length = 30)
    private String actorType;

    @Column(name = "action_code", nullable = false, length = 120)
    private String actionCode;

    @Column(name = "entity_type", nullable = false, length = 80)
    private String entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    // Colonnes char(64) (bpchar) en base, non varchar : le type JDBC est fixé
    // explicitement pour que `ddl-auto: validate` reconnaisse la correspondance.
    @Column(name = "before_hash", length = 64)
    @JdbcTypeCode(SqlTypes.CHAR)
    private String beforeHash;

    @Column(name = "after_hash", length = 64)
    @JdbcTypeCode(SqlTypes.CHAR)
    private String afterHash;

    @Column(name = "correlation_id", nullable = false)
    private UUID correlationId;

    protected AuditEventEntity() {
        // Requis par JPA.
    }

    AuditEventEntity(
            UUID id,
            UUID actorUserId,
            String actorType,
            String actionCode,
            String entityType,
            UUID entityId,
            String beforeHash,
            String afterHash,
            UUID correlationId) {
        this.id = id;
        this.actorUserId = actorUserId;
        this.actorType = actorType;
        this.actionCode = actionCode;
        this.entityType = entityType;
        this.entityId = entityId;
        this.beforeHash = beforeHash;
        this.afterHash = afterHash;
        this.correlationId = correlationId;
    }

    UUID getId() {
        return id;
    }

    Instant getCreatedAt() {
        return createdAt;
    }

    UUID getActorUserId() {
        return actorUserId;
    }

    String getActorType() {
        return actorType;
    }

    String getActionCode() {
        return actionCode;
    }

    String getEntityType() {
        return entityType;
    }

    UUID getEntityId() {
        return entityId;
    }

    String getBeforeHash() {
        return beforeHash;
    }

    String getAfterHash() {
        return afterHash;
    }

    UUID getCorrelationId() {
        return correlationId;
    }
}
