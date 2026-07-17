package ml.cnpm.platform.audit.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

/**
 * Projection JPA de {@code audit.security_event}, interne au module AUDIT.
 *
 * <p>Table en ajout seul, sans {@code @Version}. Les colonnes {@code created_at},
 * {@code details}, {@code status} et {@code source_ip} portent des valeurs par défaut en
 * base et ne sont pas mappées — {@code ddl-auto: validate} ne contrôle que les colonnes
 * mappées. La capture de l'adresse source ({@code inet}) et du contexte ({@code details})
 * est un enrichissement ultérieur.
 */
@Entity
@Table(name = "security_event", schema = "audit")
class SecurityEventEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "event_type", nullable = false, length = 120)
    private String eventType;

    @Column(name = "severity", nullable = false, length = 20)
    private String severity;

    protected SecurityEventEntity() {
        // Requis par JPA.
    }

    SecurityEventEntity(UUID id, UUID userId, String eventType, String severity) {
        this.id = id;
        this.userId = userId;
        this.eventType = eventType;
        this.severity = severity;
    }
}
