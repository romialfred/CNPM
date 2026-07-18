package ml.cnpm.platform.member.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.Immutable;

/**
 * Projection JPA de {@code member.membership_status_history} — table APPEND-ONLY (V4/V5).
 * {@code @Immutable} : insertion seule. {@code fromStatus} est nul pour le statut initial.
 */
@Entity
@Immutable
@Table(name = "membership_status_history", schema = "member")
class MembershipStatusHistoryEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "membership_id", nullable = false)
    private UUID membershipId;

    @Column(name = "from_status", length = 30)
    private String fromStatus;

    @Column(name = "to_status", nullable = false, length = 30)
    private String toStatus;

    @Column(name = "reason")
    private String reason;

    @Column(name = "created_by")
    private UUID createdBy;

    protected MembershipStatusHistoryEntity() {
        // Requis par JPA.
    }

    MembershipStatusHistoryEntity(
            UUID id, UUID membershipId, String fromStatus, String toStatus, String reason, UUID createdBy) {
        this.id = id;
        this.membershipId = membershipId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.reason = reason;
        this.createdBy = createdBy;
    }
}
