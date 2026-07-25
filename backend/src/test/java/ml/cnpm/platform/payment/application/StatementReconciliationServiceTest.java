package ml.cnpm.platform.payment.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.payment.application.port.out.ReconciliationRepository;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Règles du rapprochement automatique, éprouvées sans base ni HTTP.
 *
 * <p>Vérifie : une ligne dont le libellé porte une référence VALIDÉE est appariée (cas proposé) ;
 * une ligne sans référence exploitable tombe en « non rapproché » ; une ligne déjà importée est
 * un doublon ; la confirmation crée l'encaissement ; on ne confirme ni un cas sans référence ni
 * un cas qui n'est plus proposé.
 */
class StatementReconciliationServiceTest {

    private static final UUID ACTOR = UUID.fromString("22222222-2222-4222-8222-222222222222");
    private static final UUID CORRELATION = UUID.fromString("44444444-4444-4444-8444-444444444444");
    private static final String KNOWN_REF = "CNPM-COT-2026-000001";

    private final FakeRepository repository = new FakeRepository();
    private final RecordingAuditRecorder audit = new RecordingAuditRecorder();
    private final StatementReconciliationService service =
            new StatementReconciliationService(repository, audit);

    private static StatementImportCommand statement(StatementImportCommand.Line... lines) {
        return new StatementImportCommand(
                "BDM", "REL-2026-07", "****0001",
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31), List.of(lines));
    }

    private static StatementImportCommand.Line line(int no, String amount, String label) {
        return new StatementImportCommand.Line(
                no, LocalDate.of(2026, 7, 15), null, new BigDecimal(amount), label);
    }

    @Test
    @DisplayName("apparie une ligne dont le libellé porte une référence validée")
    void matchesByReferenceInLabel() {
        ReconciliationView.ImportSummary summary =
                service.importStatement(
                        statement(line(1, "150000.00", "Cotisation " + KNOWN_REF + " merci")),
                        ACTOR,
                        CORRELATION);

        assertThat(summary.importedLines()).isEqualTo(1);
        assertThat(summary.matched()).isEqualTo(1);
        assertThat(summary.unmatched()).isZero();
        assertThat(service.list().cases().get(0).status()).isEqualTo("PROPOSED");
        assertThat(service.list().cases().get(0).matchedReferenceValue()).isEqualTo(KNOWN_REF);
    }

    @Test
    @DisplayName("isole une ligne sans référence exploitable en « non rapproché »")
    void unmatchedWithoutReference() {
        ReconciliationView.ImportSummary summary =
                service.importStatement(
                        statement(line(1, "50000.00", "Virement sans référence")), ACTOR, CORRELATION);

        assertThat(summary.matched()).isZero();
        assertThat(summary.unmatched()).isEqualTo(1);
        assertThat(service.list().cases().get(0).status()).isEqualTo("UNMATCHED");
    }

    @Test
    @DisplayName("écarte une ligne déjà importée (doublon par empreinte)")
    void deduplicatesLines() {
        StatementImportCommand.Line same = line(1, "150000.00", "Cotisation " + KNOWN_REF);
        service.importStatement(statement(same), ACTOR, CORRELATION);
        ReconciliationView.ImportSummary again =
                service.importStatement(statement(same), ACTOR, CORRELATION);

        assertThat(again.importedLines()).isZero();
        assertThat(again.duplicates()).isEqualTo(1);
    }

    @Test
    @DisplayName("confirme un cas apparié : l'encaissement est créé")
    void confirmCreatesPayment() {
        service.importStatement(
                statement(line(1, "150000.00", "Cotisation " + KNOWN_REF)), ACTOR, CORRELATION);
        UUID caseId = UUID.fromString(service.list().cases().get(0).id());

        StatementReconciliationService.ReconciliationOutcome outcome =
                service.decide(caseId, true, null, ACTOR, CORRELATION);

        assertThat(outcome.status()).isEqualTo("CONFIRMED");
        assertThat(repository.confirmed).containsKey(caseId);
    }

    @Test
    @DisplayName("rejette un cas apparié")
    void rejectCase() {
        service.importStatement(
                statement(line(1, "150000.00", "Cotisation " + KNOWN_REF)), ACTOR, CORRELATION);
        UUID caseId = UUID.fromString(service.list().cases().get(0).id());

        assertThat(service.decide(caseId, false, "Doublon", ACTOR, CORRELATION).status())
                .isEqualTo("REJECTED");
    }

    @Test
    @DisplayName("refuse de confirmer un cas sans référence appariée")
    void refusesConfirmingUnmatched() {
        service.importStatement(statement(line(1, "50000.00", "Sans référence")), ACTOR, CORRELATION);
        UUID caseId = UUID.fromString(service.list().cases().get(0).id());

        assertThatThrownBy(() -> service.decide(caseId, true, null, ACTOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
    }

    @Test
    @DisplayName("échoue proprement sur un cas inconnu")
    void failsOnUnknownCase() {
        assertThatThrownBy(
                        () ->
                                service.decide(
                                        UUID.fromString("55555555-5555-4555-8555-555555555555"),
                                        true,
                                        null,
                                        ACTOR,
                                        CORRELATION))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    /** Dépôt en mémoire reproduisant l'adaptateur SQL (dédup par empreinte incluse). */
    private static final class FakeRepository implements ReconciliationRepository {

        private final Map<String, UUID> linesByFingerprint = new LinkedHashMap<>();
        private final Map<UUID, StoredCase> cases = new LinkedHashMap<>();
        final Map<UUID, UUID> confirmed = new LinkedHashMap<>();
        private int sequence;

        @Override
        public UUID createStatement(
                String bankCode, String statementRef, String accountRefMasked,
                LocalDate periodStart, LocalDate periodEnd, UUID actorUserId) {
            return UUID.fromString("00000000-0000-4000-9000-%012d".formatted(++sequence));
        }

        @Override
        public Optional<UUID> insertLine(
                UUID statementId, int lineNumber, LocalDate bookingDate, LocalDate valueDate,
                BigDecimal amount, String referenceText, String fingerprint, UUID actorUserId) {
            if (linesByFingerprint.containsKey(fingerprint)) {
                return Optional.empty();
            }
            UUID id = UUID.fromString("00000000-0000-4000-a000-%012d".formatted(++sequence));
            linesByFingerprint.put(fingerprint, id);
            lineData.put(id, new LineData(amount, bookingDate, referenceText));
            return Optional.of(id);
        }

        private final Map<UUID, LineData> lineData = new LinkedHashMap<>();

        @Override
        public Optional<UUID> findValidatedReferenceByValue(String referenceValue) {
            return KNOWN_REF.equals(referenceValue)
                    ? Optional.of(UUID.fromString("b0000000-0000-4000-8000-000000000001"))
                    : Optional.empty();
        }

        @Override
        public void createCase(
                UUID statementLineId, UUID matchedReferenceId, BigDecimal matchScore,
                String status, UUID actorUserId) {
            UUID id = UUID.fromString("00000000-0000-4000-b000-%012d".formatted(++sequence));
            cases.put(id, new StoredCase(statementLineId, matchedReferenceId, status));
        }

        @Override
        public List<ReconciliationView.Case> findAll() {
            List<ReconciliationView.Case> out = new ArrayList<>();
            cases.forEach(
                    (id, c) -> {
                        LineData ld = lineData.get(c.lineId());
                        out.add(
                                new ReconciliationView.Case(
                                        id.toString(),
                                        ld.bookingDate().toString(),
                                        ld.amount(),
                                        "XOF",
                                        ld.referenceText(),
                                        c.referenceId() == null ? null : new BigDecimal("100.00"),
                                        c.status(),
                                        c.referenceId() == null ? null : KNOWN_REF,
                                        c.referenceId() == null ? null : "CNPM-2022-0001",
                                        c.referenceId() == null ? null : "Société de test",
                                        confirmed.containsKey(id) ? "CNPM-PAY-00000001" : null));
                    });
            return out;
        }

        @Override
        public Optional<CaseDecision> findForDecision(UUID caseId) {
            StoredCase c = cases.get(caseId);
            if (c == null) {
                return Optional.empty();
            }
            LineData ld = lineData.get(c.lineId());
            return Optional.of(
                    new CaseDecision(c.status(), c.referenceId(), ld.amount(), ld.bookingDate(),
                            ld.referenceText()));
        }

        @Override
        public void confirm(
                UUID caseId, UUID matchedReferenceId, BigDecimal amount, LocalDate bookingDate,
                String providerReference, String idempotencyKey, UUID actorUserId) {
            confirmed.put(caseId, matchedReferenceId);
            StoredCase c = cases.get(caseId);
            cases.put(caseId, new StoredCase(c.lineId(), c.referenceId(), "CONFIRMED"));
        }

        @Override
        public void reject(UUID caseId, UUID actorUserId) {
            StoredCase c = cases.get(caseId);
            cases.put(caseId, new StoredCase(c.lineId(), c.referenceId(), "REJECTED"));
        }

        private record StoredCase(UUID lineId, UUID referenceId, String status) {}

        private record LineData(BigDecimal amount, LocalDate bookingDate, String referenceText) {}
    }

    private static final class RecordingAuditRecorder implements AuditRecorder {
        private final List<AuditEntry> entries = new ArrayList<>();

        @Override
        public void record(AuditEntry entry) {
            entries.add(entry);
        }
    }
}
