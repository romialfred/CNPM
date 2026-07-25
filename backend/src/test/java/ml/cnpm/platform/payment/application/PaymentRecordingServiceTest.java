package ml.cnpm.platform.payment.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.payment.application.port.out.PaymentTransactionRepository;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Règles de l'enregistrement d'un encaissement, éprouvées sans base ni HTTP.
 *
 * <p>Vérifie : un encaissement ne s'enregistre que contre une référence VALIDÉE ; le rejeu de
 * la même clé d'idempotence renvoie l'écriture existante sans doublon ni second audit ; le
 * canal et la positivité du montant sont contrôlés ; chaque enregistrement réel laisse une trace.
 */
class PaymentRecordingServiceTest {

    private static final UUID VALID_REF = UUID.fromString("a0000000-0000-4000-8000-000000000001");
    private static final UUID PENDING_REF = UUID.fromString("a0000000-0000-4000-8000-000000000002");
    private static final UUID UNKNOWN_REF = UUID.fromString("a0000000-0000-4000-8000-0000000000ff");
    private static final UUID ACTOR = UUID.fromString("22222222-2222-4222-8222-222222222222");
    private static final UUID CORRELATION = UUID.fromString("44444444-4444-4444-8444-444444444444");
    private static final OffsetDateTime PAID_AT = OffsetDateTime.parse("2026-07-24T10:00:00Z");

    private final FakeRepository repository = new FakeRepository();
    private final RecordingAuditRecorder audit = new RecordingAuditRecorder();
    private final PaymentRecordingService service = new PaymentRecordingService(repository, audit);

    @Test
    @DisplayName("enregistre un encaissement contre une référence validée et le trace")
    void recordsAgainstValidatedReference() {
        PaymentRecording outcome =
                service.record(
                        VALID_REF, "ORANGE_MONEY", new BigDecimal("150000.00"), PAID_AT, "OM-TX-1",
                        "key-record-000001", ACTOR, CORRELATION);

        assertThat(outcome.created()).isTrue();
        assertThat(outcome.payment().status()).isEqualTo("RECEIVED");
        assertThat(outcome.payment().transactionNumber()).startsWith("CNPM-PAY-");
        assertThat(audit.entries).hasSize(1);
        assertThat(audit.entries.get(0).actionCode()).isEqualTo("PAYMENT_TRANSACTION.RECORDED");
    }

    @Test
    @DisplayName("est idempotent : le rejeu de la même clé renvoie l'encaissement existant")
    void isIdempotentOnKey() {
        PaymentRecording first =
                service.record(VALID_REF, "WAVE", new BigDecimal("50000.00"), PAID_AT, null,
                        "key-record-000002", ACTOR, CORRELATION);
        PaymentRecording replay =
                service.record(VALID_REF, "WAVE", new BigDecimal("50000.00"), PAID_AT, null,
                        "key-record-000002", ACTOR, CORRELATION);

        assertThat(replay.created()).isFalse();
        assertThat(replay.payment().id()).isEqualTo(first.payment().id());
        assertThat(repository.transactions).hasSize(1);
        assertThat(audit.entries).hasSize(1);
    }

    @Test
    @DisplayName("refuse d'encaisser contre une référence non validée")
    void refusesNonValidatedReference() {
        assertThatThrownBy(
                        () ->
                                service.record(
                                        PENDING_REF, "ORANGE_MONEY", new BigDecimal("10000.00"), PAID_AT,
                                        null, "key-record-000003", ACTOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
        assertThat(repository.transactions).isEmpty();
    }

    @Test
    @DisplayName("échoue proprement sur une référence inconnue")
    void failsOnUnknownReference() {
        assertThatThrownBy(
                        () ->
                                service.record(
                                        UNKNOWN_REF, "CASH", new BigDecimal("1000.00"), PAID_AT, null,
                                        "key-record-000004", ACTOR, CORRELATION))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("refuse un canal inconnu et un montant non positif")
    void refusesBadChannelAndAmount() {
        assertThatThrownBy(
                        () ->
                                service.record(
                                        VALID_REF, "BITCOIN", new BigDecimal("1000.00"), PAID_AT, null,
                                        "key-record-000005", ACTOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
        assertThatThrownBy(
                        () ->
                                service.record(
                                        VALID_REF, "ORANGE_MONEY", new BigDecimal("0.00"), PAID_AT, null,
                                        "key-record-000006", ACTOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
    }

    /** Dépôt en mémoire reproduisant les projections de l'adaptateur SQL. */
    private static final class FakeRepository implements PaymentTransactionRepository {

        private final Map<UUID, PaymentTransactionView.Payment> transactions = new LinkedHashMap<>();
        private final Map<String, UUID> byKey = new LinkedHashMap<>();
        private int sequence;

        @Override
        public List<PaymentTransactionView.Payment> findAll() {
            return new ArrayList<>(transactions.values());
        }

        @Override
        public Optional<PaymentTransactionView.Payment> findById(UUID id) {
            return Optional.ofNullable(transactions.get(id));
        }

        @Override
        public Optional<PaymentTransactionView.Payment> findByIdempotencyKey(String idempotencyKey) {
            return Optional.ofNullable(byKey.get(idempotencyKey)).map(transactions::get);
        }

        @Override
        public Optional<String> referenceStatus(UUID referenceId) {
            if (VALID_REF.equals(referenceId)) return Optional.of("VALIDATED");
            if (PENDING_REF.equals(referenceId)) return Optional.of("PENDING_VALIDATION");
            return Optional.empty();
        }

        @Override
        public PaymentTransactionView.Payment record(
                UUID referenceId,
                String channel,
                BigDecimal amount,
                OffsetDateTime paidAt,
                String providerTransactionId,
                String idempotencyKey,
                UUID actorUserId) {
            UUID id = UUID.fromString("00000000-0000-4000-8000-%012d".formatted(++sequence));
            PaymentTransactionView.Payment payment =
                    new PaymentTransactionView.Payment(
                            id.toString(),
                            "CNPM-PAY-%08d".formatted(sequence),
                            "CNPM-COT-2026-000001",
                            "CNPM-2022-0001",
                            "Société de test",
                            channel,
                            amount,
                            "XOF",
                            paidAt.toString(),
                            "RECEIVED",
                            "2026-07-24T00:00:00Z");
            transactions.put(id, payment);
            byKey.put(idempotencyKey, id);
            return payment;
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
