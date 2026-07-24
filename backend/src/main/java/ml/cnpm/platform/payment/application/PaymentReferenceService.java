package ml.cnpm.platform.payment.application;

import java.time.Year;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.payment.application.port.out.PaymentReferenceRepository;
import ml.cnpm.platform.shared.api.Hashing;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Références de paiement : génération unique par cotisant, puis validation exclusive de la CNPM.
 *
 * <p>La référence est la clé de rapprochement du TDR. Elle naît NON diffusable
 * ('PENDING_VALIDATION') et ne devient exploitable qu'après validation par la CNPM
 * ('VALIDATED') — c'est le garde-fou « aucune référence diffusée sans validation préalable ».
 * La génération et la validation relèvent de permissions distinctes (séparation des devoirs) :
 * {@code PAYMENT.RECORD} pour produire, {@code PAYMENT.CONFIRM} pour valider, {@code PAYMENT.CANCEL}
 * pour révoquer, {@code PAYMENT.READ} pour lire — toutes déjà semées.
 *
 * <p>La génération est idempotente : un cotisant qui a déjà une référence vivante pour un
 * exercice la reçoit, plutôt qu'une seconde. Chaque action produit un audit corrélé.
 */
@Service
public class PaymentReferenceService {

    private static final String ENTITY_TYPE = "payment.payment_reference";
    private static final String ACTION_GENERATED = "PAYMENT_REFERENCE.GENERATED";
    private static final String ACTION_VALIDATED = "PAYMENT_REFERENCE.VALIDATED";
    private static final String ACTION_REVOKED = "PAYMENT_REFERENCE.REVOKED";

    static final String STATUS_PENDING = "PENDING_VALIDATION";
    static final String STATUS_VALIDATED = "VALIDATED";
    static final String STATUS_REVOKED = "REVOKED";

    private final PaymentReferenceRepository repository;
    private final AuditRecorder auditRecorder;

    PaymentReferenceService(PaymentReferenceRepository repository, AuditRecorder auditRecorder) {
        this.repository = repository;
        this.auditRecorder = auditRecorder;
    }

    @PreAuthorize("hasAuthority('PERM_PAYMENT.READ')")
    @Transactional(readOnly = true)
    public PaymentReferenceView.ReferenceList list() {
        return new PaymentReferenceView.ReferenceList(repository.findAll());
    }

    /**
     * Génère la référence d'un cotisant pour un exercice, ou renvoie la référence vivante
     * existante si elle a déjà été produite.
     *
     * @throws StateConflictException si l'exercice est hors bornes ou l'adhésion inconnue
     */
    @PreAuthorize("hasAuthority('PERM_PAYMENT.RECORD')")
    @Transactional
    public PaymentReferenceGeneration generate(
            UUID membershipId, int exercise, UUID actorUserId, UUID correlationId) {
        requirePlausibleExercise(exercise);

        Optional<PaymentReferenceView.Reference> existing = repository.findLive(membershipId, exercise);
        if (existing.isPresent()) {
            return new PaymentReferenceGeneration(existing.get(), false);
        }
        if (!repository.membershipExists(membershipId)) {
            throw new StateConflictException("Aucune adhésion ne correspond à ce cotisant.");
        }
        PaymentReferenceView.Reference created =
                repository.generate(membershipId, exercise, actorUserId);
        auditRecorder.record(
                AuditEntry.created(
                        actorUserId,
                        ACTION_GENERATED,
                        ENTITY_TYPE,
                        UUID.fromString(created.id()),
                        fingerprint(created),
                        correlationId));
        return new PaymentReferenceGeneration(created, true);
    }

    /**
     * Valide une référence : elle devient diffusable au cotisant.
     *
     * @throws ResourceNotFoundException si la référence n'existe pas
     * @throws StateConflictException si elle n'est pas en attente de validation
     */
    @PreAuthorize("hasAuthority('PERM_PAYMENT.CONFIRM')")
    @Transactional
    public PaymentReferenceView.Reference validate(
            UUID referenceId, UUID actorUserId, UUID correlationId) {
        PaymentReferenceView.Reference reference = require(referenceId);
        if (!STATUS_PENDING.equals(reference.status())) {
            throw new StateConflictException("Seule une référence en attente peut être validée.");
        }
        String before = fingerprint(reference);
        PaymentReferenceView.Reference validated = repository.validate(referenceId, actorUserId);
        auditRecorder.record(
                new AuditEntry(
                        "USER",
                        actorUserId,
                        ACTION_VALIDATED,
                        ENTITY_TYPE,
                        referenceId,
                        before,
                        fingerprint(validated),
                        correlationId));
        return validated;
    }

    /**
     * Révoque une référence : elle n'est plus diffusable ni exploitable.
     *
     * @param reason motif obligatoire ; seule son empreinte rejoint le journal
     * @throws ResourceNotFoundException si la référence n'existe pas
     * @throws StateConflictException si elle est déjà révoquée
     */
    @PreAuthorize("hasAuthority('PERM_PAYMENT.CANCEL')")
    @Transactional
    public PaymentReferenceView.Reference revoke(
            UUID referenceId, String reason, UUID actorUserId, UUID correlationId) {
        PaymentReferenceView.Reference reference = require(referenceId);
        if (STATUS_REVOKED.equals(reference.status())) {
            throw new StateConflictException("Cette référence est déjà révoquée.");
        }
        String before = fingerprint(reference);
        PaymentReferenceView.Reference revoked = repository.revoke(referenceId, actorUserId);
        auditRecorder.record(
                new AuditEntry(
                        "USER",
                        actorUserId,
                        ACTION_REVOKED,
                        ENTITY_TYPE,
                        referenceId,
                        before,
                        fingerprintWithReason(revoked, reason),
                        correlationId));
        return revoked;
    }

    private PaymentReferenceView.Reference require(UUID referenceId) {
        return repository
                .findById(referenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Référence de paiement introuvable."));
    }

    /** Borne l'exercice à une fenêtre plausible, sans inventer de règle de barème (DEC-008). */
    private static void requirePlausibleExercise(int exercise) {
        int current = Year.now().getValue();
        if (exercise < 2000 || exercise > current + 1) {
            throw new StateConflictException("Exercice hors de la plage autorisée.");
        }
    }

    private static String fingerprint(PaymentReferenceView.Reference reference) {
        return Hashing.sha256Hex(
                String.join(
                        "|",
                        reference.id(),
                        String.valueOf(reference.membershipId()),
                        reference.referenceValue(),
                        String.valueOf(reference.exercise()),
                        reference.status()));
    }

    private static String fingerprintWithReason(
            PaymentReferenceView.Reference reference, String reason) {
        return Hashing.sha256Hex(fingerprint(reference) + "|" + reason.trim());
    }
}
