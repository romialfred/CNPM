package ml.cnpm.platform.payment.application.port.out;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.payment.application.PaymentTransactionView;

/**
 * Port sortant de persistance des encaissements, sur le schéma {@code payment}.
 *
 * <p>La table sous-jacente est en ajout seul : ce port n'expose ni mise à jour ni suppression.
 */
public interface PaymentTransactionRepository {

    List<PaymentTransactionView.Payment> findAll();

    Optional<PaymentTransactionView.Payment> findById(UUID id);

    /** Encaissement déjà enregistré sous cette clé : fonde l'idempotence du rejeu. */
    Optional<PaymentTransactionView.Payment> findByIdempotencyKey(String idempotencyKey);

    /** État d'une référence ('PENDING_VALIDATION', 'VALIDATED', 'REVOKED'), si elle existe. */
    Optional<String> referenceStatus(UUID referenceId);

    /**
     * Écrit un encaissement (ajout seul). Peut lever une violation d'unicité si la clé
     * d'idempotence a été posée entre-temps par une écriture concurrente.
     */
    PaymentTransactionView.Payment record(
            UUID referenceId,
            String channel,
            BigDecimal amount,
            OffsetDateTime paidAt,
            String providerTransactionId,
            String idempotencyKey,
            UUID actorUserId);
}
