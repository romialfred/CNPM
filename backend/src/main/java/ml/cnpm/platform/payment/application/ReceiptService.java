package ml.cnpm.platform.payment.application;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.payment.application.port.out.ReceiptRepository;
import ml.cnpm.platform.shared.api.Hashing;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Confirmation d'un encaissement par la CNPM et émission du reçu officiel.
 *
 * <p>Souveraineté du TDR : la délivrance du reçu appartient exclusivement à la CNPM. La
 * confirmation exige {@code PAYMENT.CONFIRM} — distincte de {@code PAYMENT.RECORD} qui a servi à
 * enregistrer l'encaissement : celui qui confirme n'est pas nécessairement celui qui a saisi
 * (séparation des devoirs). L'émission est idempotente : un encaissement déjà confirmé renvoie
 * son reçu, sans en émettre un second.
 *
 * <p>Le reçu est vérifiable publiquement par un jeton de haute entropie, dont seule l'empreinte
 * SHA-256 est stockée ; le jeton lui-même n'est révélé qu'à l'émission (il alimente le QR). La
 * vérification n'expose qu'un sous-ensemble non nominatif.
 */
@Service
public class ReceiptService {

    private static final String ENTITY_TYPE = "receipt.receipt";
    private static final String ACTION_ISSUED = "RECEIPT.ISSUED";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ReceiptRepository repository;
    private final AuditRecorder auditRecorder;

    ReceiptService(ReceiptRepository repository, AuditRecorder auditRecorder) {
        this.repository = repository;
        this.auditRecorder = auditRecorder;
    }

    /**
     * Confirme un encaissement et émet son reçu (ou renvoie le reçu déjà émis).
     *
     * @throws ResourceNotFoundException si l'encaissement n'existe pas
     */
    @PreAuthorize("hasAuthority('PERM_PAYMENT.CONFIRM')")
    @Transactional
    public IssuedReceipt confirmPayment(UUID paymentTransactionId, UUID actorUserId, UUID correlationId) {
        Optional<ReceiptView.Receipt> existing =
                repository.findIssuedByTransaction(paymentTransactionId);
        if (existing.isPresent()) {
            return new IssuedReceipt(existing.get(), null, false);
        }
        if (repository.transactionStatus(paymentTransactionId).isEmpty()) {
            throw new ResourceNotFoundException("Encaissement introuvable.");
        }

        String token = newToken();
        ReceiptView.Receipt receipt =
                repository.issue(paymentTransactionId, Hashing.sha256Hex(token), actorUserId);
        auditRecorder.record(
                AuditEntry.created(
                        actorUserId,
                        ACTION_ISSUED,
                        ENTITY_TYPE,
                        UUID.fromString(receipt.id()),
                        Hashing.sha256Hex(
                                String.join(
                                        "|",
                                        receipt.id(),
                                        receipt.receiptNumber(),
                                        String.valueOf(receipt.transactionNumber()))),
                        correlationId));
        return new IssuedReceipt(receipt, token, true);
    }

    @PreAuthorize("hasAuthority('PERM_RECEIPT.READ')")
    @Transactional(readOnly = true)
    public ReceiptView.ReceiptList list() {
        return new ReceiptView.ReceiptList(repository.findAll());
    }

    @PreAuthorize("hasAuthority('PERM_RECEIPT.READ')")
    @Transactional(readOnly = true)
    public ReceiptView.Receipt get(UUID receiptId) {
        return repository
                .findById(receiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Reçu introuvable."));
    }

    /**
     * Vérification PUBLIQUE d'un reçu par jeton. Aucune autorisation : c'est le jeton lui-même,
     * de haute entropie, qui fait preuve. Un jeton inconnu répond « non valide », sans divulguer
     * quoi que ce soit.
     */
    @Transactional(readOnly = true)
    public ReceiptView.Verification verify(String token) {
        if (token == null || token.isBlank()) {
            return ReceiptView.Verification.invalid();
        }
        return repository
                .verifyByTokenHash(Hashing.sha256Hex(token.trim()))
                .orElseGet(ReceiptView.Verification::invalid);
    }

    /** Jeton opaque de 256 bits, en hexadécimal : aucun dictionnaire ne s'y oppose. */
    private static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
