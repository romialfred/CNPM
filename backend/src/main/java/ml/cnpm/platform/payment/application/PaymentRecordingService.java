package ml.cnpm.platform.payment.application;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.payment.application.port.out.PaymentTransactionRepository;
import ml.cnpm.platform.shared.api.Hashing;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Enregistrement des encaissements reçus (première méthode d'ingestion : saisie par un agent
 * CNPM ; les mêmes invariants serviront le webhook et l'import de relevé).
 *
 * <p>Un encaissement est TOUJOURS rattaché à une référence de paiement — donc à un cotisant —
 * et cette référence doit être VALIDÉE : on n'encaisse pas contre une référence qu'on n'a pas
 * le droit de diffuser. L'écriture est en ajout seul et idempotente : le même encaissement
 * rejoué (même clé) est reconnu et renvoyé, jamais dupliqué. Chaque enregistrement produit un
 * audit corrélé ; le montant complet n'est jamais journalisé en clair, seule son empreinte.
 */
@Service
public class PaymentRecordingService {

    private static final String ENTITY_TYPE = "payment.payment_transaction";
    private static final String ACTION_RECORDED = "PAYMENT_TRANSACTION.RECORDED";

    /** Canaux d'encaissement acceptés — Mobile Money du Mali, virement, espèces. */
    private static final Set<String> CHANNELS =
            Set.of("ORANGE_MONEY", "WAVE", "MTN_MONEY", "BANK_TRANSFER", "CASH");

    private final PaymentTransactionRepository repository;
    private final AuditRecorder auditRecorder;

    PaymentRecordingService(PaymentTransactionRepository repository, AuditRecorder auditRecorder) {
        this.repository = repository;
        this.auditRecorder = auditRecorder;
    }

    @PreAuthorize("hasAuthority('PERM_PAYMENT.READ')")
    @Transactional(readOnly = true)
    public PaymentTransactionView.PaymentList list() {
        return new PaymentTransactionView.PaymentList(repository.findAll());
    }

    /**
     * Enregistre un encaissement contre une référence validée.
     *
     * @param amount montant strictement positif, en {@code numeric(19,2)}
     * @param idempotencyKey clé d'idempotence ; un rejeu renvoie l'encaissement déjà écrit
     * @throws ResourceNotFoundException si la référence n'existe pas
     * @throws StateConflictException si la référence n'est pas validée, le canal inconnu, ou le
     *     montant non positif
     */
    @PreAuthorize("hasAuthority('PERM_PAYMENT.RECORD')")
    @Transactional
    public PaymentRecording record(
            UUID referenceId,
            String channel,
            BigDecimal amount,
            OffsetDateTime paidAt,
            String providerTransactionId,
            String idempotencyKey,
            UUID actorUserId,
            UUID correlationId) {
        Optional<PaymentTransactionView.Payment> replayed =
                repository.findByIdempotencyKey(idempotencyKey);
        if (replayed.isPresent()) {
            return new PaymentRecording(replayed.get(), false);
        }

        if (!CHANNELS.contains(channel)) {
            throw new StateConflictException("Canal d’encaissement non pris en charge.");
        }
        if (amount == null || amount.signum() <= 0) {
            throw new StateConflictException("Le montant de l’encaissement doit être positif.");
        }
        String status =
                repository
                        .referenceStatus(referenceId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Référence de paiement introuvable."));
        if (!"VALIDATED".equals(status)) {
            throw new StateConflictException(
                    "Un encaissement ne peut être enregistré que contre une référence validée.");
        }

        PaymentTransactionView.Payment recorded;
        try {
            recorded =
                    repository.record(
                            referenceId,
                            channel,
                            amount.setScale(2, java.math.RoundingMode.HALF_UP),
                            paidAt,
                            blankToNull(providerTransactionId),
                            idempotencyKey,
                            actorUserId);
        } catch (DuplicateKeyException concurrentReplay) {
            // Une écriture concurrente a posé la même clé : c'est un rejeu, pas un doublon.
            return new PaymentRecording(
                    repository
                            .findByIdempotencyKey(idempotencyKey)
                            .orElseThrow(() -> concurrentReplay),
                    false);
        }

        auditRecorder.record(
                AuditEntry.created(
                        actorUserId,
                        ACTION_RECORDED,
                        ENTITY_TYPE,
                        UUID.fromString(recorded.id()),
                        fingerprint(recorded),
                        correlationId));
        return new PaymentRecording(recorded, true);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /** Empreinte de l'encaissement : identité, référence, canal et montant — jamais en clair. */
    private static String fingerprint(PaymentTransactionView.Payment payment) {
        return Hashing.sha256Hex(
                String.join(
                        "|",
                        payment.id(),
                        payment.transactionNumber(),
                        String.valueOf(payment.referenceValue()),
                        payment.channel(),
                        String.valueOf(payment.amount())));
    }
}
