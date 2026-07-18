package ml.cnpm.platform.member.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Projection JPA d'écriture de {@code member.membership}.
 *
 * <p>Distincte de {@code MembershipListEntity}, qui lit la vue enrichie servant BO-002 : ici
 * on écrit la table de base lors de l'activation d'un membre.
 */
@Entity
@Table(name = "membership", schema = "member")
class MembershipEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "membership_number", nullable = false, length = 60)
    private String membershipNumber;

    @Column(name = "category_code", nullable = false, length = 50)
    private String categoryCode;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "joined_at")
    private LocalDate joinedAt;

    @Column(name = "activated_at")
    private Instant activatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected MembershipEntity() {
        // Requis par JPA.
    }

    MembershipEntity(
            UUID id,
            UUID organizationId,
            String membershipNumber,
            String categoryCode,
            String status,
            LocalDate joinedAt,
            Instant activatedAt) {
        this.id = id;
        this.organizationId = organizationId;
        this.membershipNumber = membershipNumber;
        this.categoryCode = categoryCode;
        this.status = status;
        this.joinedAt = joinedAt;
        this.activatedAt = activatedAt;
    }

    UUID getId() {
        return id;
    }

    UUID getOrganizationId() {
        return organizationId;
    }

    String getMembershipNumber() {
        return membershipNumber;
    }

    String getCategoryCode() {
        return categoryCode;
    }

    String getStatus() {
        return status;
    }

    LocalDate getJoinedAt() {
        return joinedAt;
    }

    long getVersion() {
        return version == null ? 0L : version;
    }
}
