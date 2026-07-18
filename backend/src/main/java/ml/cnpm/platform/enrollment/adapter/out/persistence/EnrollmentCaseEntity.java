package ml.cnpm.platform.enrollment.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

/** Projection JPA de {@code enrollment.enrollment_case}, interne à l'adaptateur. */
@Entity
@Table(name = "enrollment_case", schema = "enrollment")
class EnrollmentCaseEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "case_number", nullable = false, length = 60)
    private String caseNumber;

    @Column(name = "channel", nullable = false, length = 30)
    private String channel;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "assigned_to")
    private UUID assignedTo;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected EnrollmentCaseEntity() {
        // Requis par JPA.
    }

    EnrollmentCaseEntity(
            UUID id, UUID organizationId, String caseNumber, String channel, String status) {
        this.id = id;
        this.organizationId = organizationId;
        this.caseNumber = caseNumber;
        this.channel = channel;
        this.status = status;
    }

    UUID getId() {
        return id;
    }

    UUID getOrganizationId() {
        return organizationId;
    }

    String getCaseNumber() {
        return caseNumber;
    }

    String getChannel() {
        return channel;
    }

    String getStatus() {
        return status;
    }

    Instant getSubmittedAt() {
        return submittedAt;
    }

    UUID getAssignedTo() {
        return assignedTo;
    }

    long getVersion() {
        return version == null ? 0L : version;
    }

    void applyStatus(String value) {
        this.status = value;
    }

    void applySubmittedAt(Instant value) {
        this.submittedAt = value;
    }

    void applyAssignedTo(UUID value) {
        this.assignedTo = value;
    }
}
