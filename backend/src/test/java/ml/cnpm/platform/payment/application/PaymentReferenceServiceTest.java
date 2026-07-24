package ml.cnpm.platform.payment.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Year;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.payment.application.port.out.PaymentReferenceRepository;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Règles des références de paiement, éprouvées sans base ni HTTP.
 *
 * <p>Ce qui est vérifié : une référence naît en attente de validation ; sa génération est
 * idempotente par cotisant et par exercice ; seule une référence en attente se valide ; une
 * référence révoquée ne se révoque pas deux fois ; chaque action réelle laisse une trace.
 */
class PaymentReferenceServiceTest {

    private static final UUID MEMBERSHIP = UUID.fromString("b2222222-0000-4000-8000-000000000001");
    private static final UUID UNKNOWN = UUID.fromString("b2222222-0000-4000-8000-0000000000ff");
    private static final UUID ACTOR = UUID.fromString("22222222-2222-4222-8222-222222222222");
    private static final UUID CORRELATION = UUID.fromString("44444444-4444-4444-8444-444444444444");
    private static final int EXERCISE = Year.now().getValue();

    private final FakeRepository repository = new FakeRepository();
    private final RecordingAuditRecorder audit = new RecordingAuditRecorder();
    private final PaymentReferenceService service = new PaymentReferenceService(repository, audit);

    @Test
    @DisplayName("génère une référence en attente de validation et la trace")
    void generatesPendingReference() {
        PaymentReferenceGeneration outcome =
                service.generate(MEMBERSHIP, EXERCISE, ACTOR, CORRELATION);

        assertThat(outcome.created()).isTrue();
        assertThat(outcome.reference().status()).isEqualTo("PENDING_VALIDATION");
        assertThat(outcome.reference().referenceValue()).startsWith("CNPM-COT-");
        assertThat(audit.entries).hasSize(1);
        assertThat(audit.entries.get(0).actionCode()).isEqualTo("PAYMENT_REFERENCE.GENERATED");
    }

    @Test
    @DisplayName("est idempotente : un cotisant déjà pourvu reçoit sa référence, pas une seconde")
    void isIdempotentPerMembershipAndExercise() {
        PaymentReferenceGeneration first = service.generate(MEMBERSHIP, EXERCISE, ACTOR, CORRELATION);
        PaymentReferenceGeneration second =
                service.generate(MEMBERSHIP, EXERCISE, ACTOR, CORRELATION);

        assertThat(second.created()).isFalse();
        assertThat(second.reference().id()).isEqualTo(first.reference().id());
        assertThat(repository.references).hasSize(1);
        assertThat(audit.entries).hasSize(1);
    }

    @Test
    @DisplayName("refuse de générer pour une adhésion inconnue")
    void refusesUnknownMembership() {
        assertThatThrownBy(() -> service.generate(UNKNOWN, EXERCISE, ACTOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
    }

    @Test
    @DisplayName("refuse un exercice hors de la plage plausible")
    void refusesImplausibleExercise() {
        assertThatThrownBy(() -> service.generate(MEMBERSHIP, 1990, ACTOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
    }

    @Test
    @DisplayName("valide une référence en attente et la rend diffusable")
    void validatesPendingReference() {
        UUID id =
                UUID.fromString(service.generate(MEMBERSHIP, EXERCISE, ACTOR, CORRELATION).reference().id());

        PaymentReferenceView.Reference validated = service.validate(id, ACTOR, CORRELATION);

        assertThat(validated.status()).isEqualTo("VALIDATED");
        assertThat(audit.entries.get(1).actionCode()).isEqualTo("PAYMENT_REFERENCE.VALIDATED");
    }

    @Test
    @DisplayName("refuse de valider une référence qui n'est plus en attente")
    void refusesValidatingNonPending() {
        UUID id =
                UUID.fromString(service.generate(MEMBERSHIP, EXERCISE, ACTOR, CORRELATION).reference().id());
        service.validate(id, ACTOR, CORRELATION);

        assertThatThrownBy(() -> service.validate(id, ACTOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
    }

    @Test
    @DisplayName("révoque une référence et la trace")
    void revokesReference() {
        UUID id =
                UUID.fromString(service.generate(MEMBERSHIP, EXERCISE, ACTOR, CORRELATION).reference().id());

        PaymentReferenceView.Reference revoked =
                service.revoke(id, "Cotisant radié", ACTOR, CORRELATION);

        assertThat(revoked.status()).isEqualTo("REVOKED");
        assertThat(audit.entries.get(1).actionCode()).isEqualTo("PAYMENT_REFERENCE.REVOKED");
    }

    @Test
    @DisplayName("refuse de révoquer deux fois")
    void refusesDoubleRevocation() {
        UUID id =
                UUID.fromString(service.generate(MEMBERSHIP, EXERCISE, ACTOR, CORRELATION).reference().id());
        service.revoke(id, "Motif", ACTOR, CORRELATION);

        assertThatThrownBy(() -> service.revoke(id, "Motif", ACTOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
    }

    @Test
    @DisplayName("échoue proprement sur une référence inconnue")
    void failsOnUnknownReference() {
        UUID unknown = UUID.fromString("55555555-5555-4555-8555-555555555555");
        assertThatThrownBy(() -> service.validate(unknown, ACTOR, CORRELATION))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.revoke(unknown, "Motif", ACTOR, CORRELATION))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    /** Dépôt en mémoire reproduisant les projections de l'adaptateur SQL. */
    private static final class FakeRepository implements PaymentReferenceRepository {

        private final Map<UUID, PaymentReferenceView.Reference> references = new LinkedHashMap<>();
        private int sequence;

        @Override
        public List<PaymentReferenceView.Reference> findAll() {
            return new ArrayList<>(references.values());
        }

        @Override
        public Optional<PaymentReferenceView.Reference> findById(UUID id) {
            return Optional.ofNullable(references.get(id));
        }

        @Override
        public Optional<PaymentReferenceView.Reference> findLive(UUID membershipId, int exercise) {
            return references.values().stream()
                    .filter(
                            reference ->
                                    membershipId.toString().equals(reference.membershipId())
                                            && Integer.valueOf(exercise).equals(reference.exercise())
                                            && !"REVOKED".equals(reference.status()))
                    .findFirst();
        }

        @Override
        public boolean membershipExists(UUID membershipId) {
            return MEMBERSHIP.equals(membershipId);
        }

        @Override
        public PaymentReferenceView.Reference generate(UUID membershipId, int exercise, UUID actor) {
            UUID id = UUID.fromString("00000000-0000-4000-8000-%012d".formatted(++sequence));
            PaymentReferenceView.Reference reference =
                    new PaymentReferenceView.Reference(
                            id.toString(),
                            membershipId.toString(),
                            "CNPM-2022-0001",
                            "Société de test",
                            "CNPM-COT-%d-%06d".formatted(exercise, sequence),
                            exercise,
                            "PENDING_VALIDATION",
                            null,
                            "2026-07-24T00:00:00Z");
            references.put(id, reference);
            return reference;
        }

        @Override
        public PaymentReferenceView.Reference validate(UUID id, UUID actor) {
            return transition(id, "VALIDATED", "2026-07-24T00:00:00Z");
        }

        @Override
        public PaymentReferenceView.Reference revoke(UUID id, UUID actor) {
            PaymentReferenceView.Reference current = references.get(id);
            return transition(id, "REVOKED", current.approvedAt());
        }

        private PaymentReferenceView.Reference transition(UUID id, String status, String approvedAt) {
            PaymentReferenceView.Reference c = references.get(id);
            PaymentReferenceView.Reference updated =
                    new PaymentReferenceView.Reference(
                            c.id(),
                            c.membershipId(),
                            c.membershipNumber(),
                            c.organizationName(),
                            c.referenceValue(),
                            c.exercise(),
                            status,
                            approvedAt,
                            c.createdAt());
            references.put(id, updated);
            return updated;
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
