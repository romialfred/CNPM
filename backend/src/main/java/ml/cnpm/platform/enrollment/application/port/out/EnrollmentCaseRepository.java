package ml.cnpm.platform.enrollment.application.port.out;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.enrollment.application.EnrollmentCaseDraft;
import ml.cnpm.platform.enrollment.domain.EnrollmentCase;
import ml.cnpm.platform.enrollment.domain.EnrollmentStatus;

/**
 * Port sortant du module ENROLLMENT : persistance des dossiers, des contrôles et des
 * décisions. Le service applicatif dépend de cette abstraction, jamais de Spring Data.
 */
public interface EnrollmentCaseRepository {

    /** Recherche par identité métier — support de l'idempotence de création. */
    Optional<EnrollmentCase> findByCaseNumber(String caseNumber);

    Optional<EnrollmentCase> findById(UUID id);

    EnrollmentCase create(EnrollmentCaseDraft draft);

    /**
     * Applique un changement d'état déjà autorisé par la garde du domaine. {@code submittedAt}
     * n'est renseigné que lors d'une soumission et {@code assignedTo} que lors d'une prise en
     * charge ; les deux sont ignorés lorsqu'ils sont nuls.
     */
    EnrollmentCase applyStatus(
            UUID id, EnrollmentStatus target, Instant submittedAt, UUID assignedTo);

    /** Consigne un contrôle (table append-only {@code enrollment.enrollment_review}). */
    void recordReview(UUID caseId, String reviewType, String result, String comment, UUID authorId);

    /** Consigne une décision (table append-only {@code enrollment.enrollment_decision}). */
    void recordDecision(
            UUID caseId, String decision, String reasonCode, String comment, UUID decidedBy);
}
