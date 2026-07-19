package ml.cnpm.platform.recovery.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Projection JPA interne de {@code recovery.campaign}. */
@Entity
@Table(name = "campaign", schema = "recovery")
class CollectionCampaignEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "campaign_code", nullable = false, length = 60)
    private String campaignCode;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "target_segment", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> targetSegment;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at")
    private Instant endAt;

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

    protected CollectionCampaignEntity() {
        // Requis par JPA.
    }

    UUID getId() {
        return id;
    }

    String getCampaignCode() {
        return campaignCode;
    }

    String getName() {
        return name;
    }

    Map<String, Object> getTargetSegment() {
        return targetSegment;
    }

    Instant getStartAt() {
        return startAt;
    }

    Instant getEndAt() {
        return endAt;
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
