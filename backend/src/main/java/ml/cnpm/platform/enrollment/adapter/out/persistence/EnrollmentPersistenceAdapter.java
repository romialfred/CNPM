package ml.cnpm.platform.enrollment.adapter.out.persistence;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.Instant;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.enrollment.application.EnrollmentCaseDraft;
import ml.cnpm.platform.enrollment.application.port.out.EnrollmentCaseRepository;
import ml.cnpm.platform.enrollment.domain.EnrollmentCase;
import ml.cnpm.platform.enrollment.domain.EnrollmentStatus;
import org.springframework.stereotype.Repository;

/**
 * Adaptateur de persistance du module ENROLLMENT.
 *
 * <p>Le changement d'état passe par l'entité gérée : le flush déclenche le contrôle
 * {@code @Version}, de sorte qu'une transition concurrente sur le même dossier échoue au
 * lieu d'écraser silencieusement l'autre. Contrôles et décisions sont insérés dans des
 * tables append-only.
 */
@Repository
class EnrollmentPersistenceAdapter implements EnrollmentCaseRepository {

    private final EnrollmentCaseJpaRepository caseRepository;

    /**
     * Les tables en ajout seul sont écrites par {@code persist} et non par {@code save} : une
     * entité à identifiant assigné et sans {@code @Version} serait vue comme « non nouvelle »
     * par Spring Data, qui ferait un {@code merge} — donc un SELECT inutile avant chaque
     * INSERT. Même choix que {@code JpaAuditRecorder}.
     */
    @PersistenceContext private EntityManager entityManager;

    EnrollmentPersistenceAdapter(EnrollmentCaseJpaRepository caseRepository) {
        this.caseRepository = caseRepository;
    }

    @Override
    public Optional<EnrollmentCase> findByCaseNumber(String caseNumber) {
        return caseRepository.findByCaseNumber(caseNumber).map(EnrollmentPersistenceAdapter::toDomain);
    }

    @Override
    public Optional<EnrollmentCase> findById(UUID id) {
        return caseRepository.findById(id).map(EnrollmentPersistenceAdapter::toDomain);
    }

    @Override
    public EnrollmentCase create(EnrollmentCaseDraft draft) {
        EnrollmentCaseEntity entity =
                new EnrollmentCaseEntity(
                        UUID.randomUUID(),
                        draft.organizationId(),
                        draft.caseNumber(),
                        draft.channel(),
                        EnrollmentStatus.DRAFT.name());
        return toDomain(caseRepository.save(entity));
    }

    @Override
    public EnrollmentCase applyStatus(
            UUID id, EnrollmentStatus target, Instant submittedAt, UUID assignedTo) {
        EnrollmentCaseEntity entity =
                caseRepository
                        .findById(id)
                        .orElseThrow(() -> new NoSuchElementException("enrollment case " + id));
        entity.applyStatus(target.name());
        if (submittedAt != null) {
            entity.applySubmittedAt(submittedAt);
        }
        if (assignedTo != null) {
            entity.applyAssignedTo(assignedTo);
        }
        return toDomain(caseRepository.saveAndFlush(entity));
    }

    @Override
    public void recordReview(
            UUID caseId, String reviewType, String result, String comment, UUID authorId) {
        entityManager.persist(
                new EnrollmentReviewEntity(
                        UUID.randomUUID(), caseId, reviewType, result, comment, authorId));
    }

    @Override
    public void recordDecision(
            UUID caseId, String decision, String reasonCode, String comment, UUID decidedBy) {
        entityManager.persist(
                new EnrollmentDecisionEntity(
                        UUID.randomUUID(), caseId, decision, reasonCode, comment, decidedBy));
    }

    private static EnrollmentCase toDomain(EnrollmentCaseEntity entity) {
        return new EnrollmentCase(
                entity.getId(),
                entity.getCaseNumber(),
                entity.getOrganizationId(),
                entity.getChannel(),
                EnrollmentStatus.valueOf(entity.getStatus()),
                entity.getSubmittedAt(),
                entity.getAssignedTo(),
                entity.getVersion());
    }
}
