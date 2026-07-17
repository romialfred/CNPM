package ml.cnpm.platform.member.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.Immutable;

/**
 * Projection JPA en LECTURE SEULE de la vue {@code member.organization_status_history}.
 *
 * <p>Une ligne par changement de statut d'adhésion, déjà rattachée à son entreprise et à
 * son numéro d'adhésion : ni relation vers-plusieurs, ni N+1. {@code @Immutable} car une
 * vue ne se met pas à jour.
 */
@Entity
@Immutable
@Table(name = "organization_status_history", schema = "member")
class OrganizationStatusHistoryEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "membership_id", nullable = false)
    private UUID membershipId;

    @Column(name = "membership_number", nullable = false)
    private String membershipNumber;

    @Column(name = "from_status")
    private String fromStatus;

    @Column(name = "to_status", nullable = false)
    private String toStatus;

    @Column(name = "reason")
    private String reason;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "created_by")
    private UUID createdBy;

    protected OrganizationStatusHistoryEntity() {
        // Requis par JPA.
    }

    UUID getId() {
        return id;
    }

    UUID getOrganizationId() {
        return organizationId;
    }

    UUID getMembershipId() {
        return membershipId;
    }

    String getMembershipNumber() {
        return membershipNumber;
    }

    String getFromStatus() {
        return fromStatus;
    }

    String getToStatus() {
        return toStatus;
    }

    String getReason() {
        return reason;
    }

    Instant getCreatedAt() {
        return createdAt;
    }

    UUID getCreatedBy() {
        return createdBy;
    }
}
