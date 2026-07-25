package ml.cnpm.platform.payment.application.port.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.payment.application.ReceiptView;

/**
 * Port sortant de persistance des reçus, sur le schéma {@code receipt}.
 *
 * <p>La table est en ajout seul : ce port n'écrit que par insertion.
 */
public interface ReceiptRepository {

    List<ReceiptView.Receipt> findAll();

    Optional<ReceiptView.Receipt> findById(UUID id);

    /** Reçu émis pour un encaissement, s'il en existe déjà un : fonde l'idempotence de l'émission. */
    Optional<ReceiptView.Receipt> findIssuedByTransaction(UUID paymentTransactionId);

    /** Vérification publique par empreinte de jeton. */
    Optional<ReceiptView.Verification> verifyByTokenHash(String tokenHash);

    /** État d'un encaissement ('RECEIVED', ...), si la transaction existe. */
    Optional<String> transactionStatus(UUID paymentTransactionId);

    /** Émet un reçu (ajout seul) et le renvoie. */
    ReceiptView.Receipt issue(UUID paymentTransactionId, String verificationTokenHash, UUID actorUserId);
}
