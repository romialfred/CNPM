package ml.cnpm.platform.payment.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.payment.application.port.out.ReceiptRepository;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Règles de la confirmation et de l'émission d'un reçu, éprouvées sans base ni HTTP.
 *
 * <p>Vérifie : la confirmation émet un reçu et révèle son jeton une seule fois ; une seconde
 * confirmation renvoie le reçu existant sans nouveau jeton ni nouvel audit ; la vérification par
 * jeton reconnaît un reçu émis et rejette un jeton inconnu ; une transaction absente est refusée.
 */
class ReceiptServiceTest {

    private static final UUID TX = UUID.fromString("a0000000-0000-4000-8000-000000000001");
    private static final UUID UNKNOWN_TX = UUID.fromString("a0000000-0000-4000-8000-0000000000ff");
    private static final UUID ACTOR = UUID.fromString("22222222-2222-4222-8222-222222222222");
    private static final UUID CORRELATION = UUID.fromString("44444444-4444-4444-8444-444444444444");

    private final FakeRepository repository = new FakeRepository();
    private final RecordingAuditRecorder audit = new RecordingAuditRecorder();
    private final ReceiptService service = new ReceiptService(repository, audit);

    @Test
    @DisplayName("confirme un encaissement, émet le reçu et révèle le jeton une seule fois")
    void confirmsAndIssues() {
        IssuedReceipt outcome = service.confirmPayment(TX, ACTOR, CORRELATION);

        assertThat(outcome.created()).isTrue();
        assertThat(outcome.verificationToken()).isNotBlank();
        assertThat(outcome.receipt().receiptNumber()).startsWith("CNPM-REC-");
        assertThat(outcome.receipt().status()).isEqualTo("ISSUED");
        assertThat(audit.entries).hasSize(1);
        assertThat(audit.entries.get(0).actionCode()).isEqualTo("RECEIPT.ISSUED");
    }

    @Test
    @DisplayName("est idempotent : re-confirmer renvoie le reçu existant, sans jeton ni nouvel audit")
    void isIdempotent() {
        IssuedReceipt first = service.confirmPayment(TX, ACTOR, CORRELATION);
        IssuedReceipt replay = service.confirmPayment(TX, ACTOR, CORRELATION);

        assertThat(replay.created()).isFalse();
        assertThat(replay.verificationToken()).isNull();
        assertThat(replay.receipt().id()).isEqualTo(first.receipt().id());
        assertThat(repository.receipts).hasSize(1);
        assertThat(audit.entries).hasSize(1);
    }

    @Test
    @DisplayName("vérifie publiquement un reçu par son jeton, et rejette un jeton inconnu")
    void verifiesByToken() {
        String token = service.confirmPayment(TX, ACTOR, CORRELATION).verificationToken();

        assertThat(service.verify(token).valid()).isTrue();
        assertThat(service.verify("jeton-bidon").valid()).isFalse();
        assertThat(service.verify(null).valid()).isFalse();
    }

    @Test
    @DisplayName("refuse de confirmer un encaissement inconnu")
    void refusesUnknownTransaction() {
        assertThatThrownBy(() -> service.confirmPayment(UNKNOWN_TX, ACTOR, CORRELATION))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    /** Dépôt en mémoire reproduisant les projections de l'adaptateur SQL. */
    private static final class FakeRepository implements ReceiptRepository {

        private final Map<UUID, ReceiptView.Receipt> receipts = new LinkedHashMap<>();
        private final Map<UUID, String> tokenHashByReceipt = new LinkedHashMap<>();
        private final Map<UUID, UUID> receiptByTransaction = new LinkedHashMap<>();
        private int sequence;

        @Override
        public List<ReceiptView.Receipt> findAll() {
            return new ArrayList<>(receipts.values());
        }

        @Override
        public Optional<ReceiptView.Receipt> findById(UUID id) {
            return Optional.ofNullable(receipts.get(id));
        }

        @Override
        public Optional<ReceiptView.Receipt> findIssuedByTransaction(UUID paymentTransactionId) {
            return Optional.ofNullable(receiptByTransaction.get(paymentTransactionId))
                    .map(receipts::get);
        }

        @Override
        public Optional<ReceiptView.Verification> verifyByTokenHash(String tokenHash) {
            return tokenHashByReceipt.entrySet().stream()
                    .filter(entry -> entry.getValue().equals(tokenHash))
                    .map(entry -> receipts.get(entry.getKey()))
                    .findFirst()
                    .map(
                            receipt ->
                                    new ReceiptView.Verification(
                                            true,
                                            receipt.receiptNumber(),
                                            receipt.organizationName(),
                                            receipt.amount(),
                                            receipt.currency(),
                                            receipt.issuedAt(),
                                            receipt.status()));
        }

        @Override
        public Optional<String> transactionStatus(UUID paymentTransactionId) {
            return TX.equals(paymentTransactionId) ? Optional.of("RECEIVED") : Optional.empty();
        }

        @Override
        public ReceiptView.Receipt issue(
                UUID paymentTransactionId, String verificationTokenHash, UUID actorUserId) {
            UUID id = UUID.fromString("00000000-0000-4000-8000-%012d".formatted(++sequence));
            ReceiptView.Receipt receipt =
                    new ReceiptView.Receipt(
                            id.toString(),
                            "CNPM-REC-%08d".formatted(sequence),
                            "CNPM-PAY-00000001",
                            "CNPM-COT-2026-000001",
                            "CNPM-2022-0001",
                            "Société de test",
                            "ORANGE_MONEY",
                            new BigDecimal("150000.00"),
                            "XOF",
                            "2026-07-24T10:00:00Z",
                            "2026-07-24T11:00:00Z",
                            "ISSUED");
            receipts.put(id, receipt);
            tokenHashByReceipt.put(id, verificationTokenHash);
            receiptByTransaction.put(paymentTransactionId, id);
            return receipt;
        }
    }

    private static final class RecordingAuditRecorder implements AuditRecorder {
        private final List<AuditEntry> entries = new ArrayList<>();

        @Override
        public void record(AuditEntry entry) {
            entries.add(entry);
        }
    }
}
