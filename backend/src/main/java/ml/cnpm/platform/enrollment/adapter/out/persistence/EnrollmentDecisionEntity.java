package ml.cnpm.platform.enrollment.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.Immutable;

/**
 * Projection JPA de {@code enrollment.enrollment_decision} — table APPEND-ONLY (triggers
 * V4/V5). La décision est nominative : {@code decided_by} est NOT NULL en base.
 */
@Entity
@Immutable
@Table(name = "enrollment_decision", schema = "enrollment")
class EnrollmentDecisionEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "case_id", nullable = false)
    private UUID caseId;

    @Column(name = "decision", nullable = false, length = 30)
    private String decision;

    @Column(name = "reason_code", length = 60)
    private String reasonCode;

    @Column(name = "comment")
    private String comment;

    @Column(name = "decided_by", nullable = false)
    private UUID decidedBy;

    @Column(name = "created_by")
    private UUID createdBy;

    protected EnrollmentDecisionEntity() {
        // Requis par JPA.
    }

    EnrollmentDecisionEntity(
            UUID id,
            UUID caseId,
            String decision,
            String reasonCode,
            String comment,
            UUID decidedBy) {
        this.id = id;
        this.caseId = caseId;
        this.decision = decision;
        this.reasonCode = reasonCode;
        this.comment = comment;
        this.decidedBy = decidedBy;
        this.createdBy = decidedBy;
    }
}
