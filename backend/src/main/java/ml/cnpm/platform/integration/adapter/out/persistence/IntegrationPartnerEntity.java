package ml.cnpm.platform.integration.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

/** Projection JPA interne de {@code integration.partner}. */
@Entity
@Table(name = "partner", schema = "integration")
class IntegrationPartnerEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "partner_code", nullable = false, length = 60)
    private String partnerCode;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "partner_type", nullable = false, length = 40)
    private String partnerType;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "created_by", updatable = false)
    private UUID createdBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected IntegrationPartnerEntity() {
        // Requis par JPA.
    }

    UUID getId() {
        return id;
    }

    String getPartnerCode() {
        return partnerCode;
    }

    String getName() {
        return name;
    }

    String getPartnerType() {
        return partnerType;
    }

    String getStatus() {
        return status;
    }

    Instant getCreatedAt() {
        return createdAt;
    }

    UUID getCreatedBy() {
        return createdBy;
    }

    Instant getUpdatedAt() {
        return updatedAt;
    }

    long getVersion() {
        return version == null ? 0L : version;
    }
}
