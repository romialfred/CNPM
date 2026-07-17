package ml.cnpm.platform.member.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Projection JPA de {@code member.membership}, interne à l'adaptateur.
 *
 * <p>La relation vers l'entreprise est {@code LAZY} : l'adaptateur la charge par jointure
 * explicite (fetch) au moment de la recherche, ce qui évite le N+1 sans forcer un
 * chargement systématique ailleurs.
 */
@Entity
@Table(name = "membership", schema = "member")
class MembershipEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private OrganizationEntity organization;

    @Column(name = "membership_number", nullable = false, length = 60)
    private String membershipNumber;

    @Column(name = "category_code", nullable = false, length = 50)
    private String categoryCode;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "joined_at")
    private LocalDate joinedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected MembershipEntity() {
        // Requis par JPA.
    }

    UUID getId() {
        return id;
    }

    OrganizationEntity getOrganization() {
        return organization;
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
