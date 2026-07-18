package ml.cnpm.platform.enrollment.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.Immutable;

/**
 * Projection JPA de {@code enrollment.enrollment_review} — table APPEND-ONLY (triggers
 * V4/V5). {@code @Immutable} : insertion seule, jamais de mise à jour.
 */
@Entity
@Immutable
@Table(name = "enrollment_review", schema = "enrollment")
class EnrollmentReviewEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "case_id", nullable = false)
    private UUID caseId;

    @Column(name = "review_type", nullable = false, length = 40)
    private String reviewType;

    @Column(name = "result", nullable = false, length = 30)
    private String result;

    @Column(name = "comment")
    private String comment;

    @Column(name = "created_by")
    private UUID createdBy;

    protected EnrollmentReviewEntity() {
        // Requis par JPA.
    }

    EnrollmentReviewEntity(
            UUID id, UUID caseId, String reviewType, String result, String comment, UUID createdBy) {
        this.id = id;
        this.caseId = caseId;
        this.reviewType = reviewType;
        this.result = result;
        this.comment = comment;
        this.createdBy = createdBy;
    }
}
