package ml.cnpm.platform.payment.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.payment.application.port.out.CollectionAccountRepository;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Règles des comptes d'encaissement, éprouvées sans base ni HTTP.
 *
 * <p>Ce qui est vérifié : un compte naît en brouillon et non diffusable, le canal et la
 * cohérence des coordonnées sont contrôlés, un doublon de numéro est refusé, la validation
 * est interdite à l'auteur (séparation des tâches) et n'agit que sur un brouillon, la
 * désactivation n'agit que sur un compte actif — et chaque action réelle laisse une trace
 * corrélée. Les autorisations {@code @PreAuthorize} et la chaîne HTTP relèvent d'un test
 * d'intégration distinct.
 */
class CollectionAccountServiceTest {

    private static final UUID CREATOR = UUID.fromString("22222222-2222-4222-8222-222222222222");
    private static final UUID VALIDATOR = UUID.fromString("33333333-3333-4333-8333-333333333333");
    private static final UUID CORRELATION = UUID.fromString("44444444-4444-4444-8444-444444444444");

    private final FakeRepository repository = new FakeRepository();
    private final RecordingAuditRecorder audit = new RecordingAuditRecorder();
    private final CollectionAccountService service =
            new CollectionAccountService(repository, audit);

    private static CollectionAccountDraft orangeMoney() {
        return new CollectionAccountDraft(
                "ORANGE_MONEY", "Compte principal CNPM", "CNPM", "+223 70 00 00 00", null, null);
    }

    @Test
    @DisplayName("crée un compte en brouillon, non diffusable, et le trace")
    void createsADraft() {
        CollectionAccountView.Account created = service.create(orangeMoney(), CREATOR, CORRELATION);

        assertThat(created.status()).isEqualTo("DRAFT");
        assertThat(created.channel()).isEqualTo("ORANGE_MONEY");
        assertThat(audit.entries).hasSize(1);
        assertThat(audit.entries.get(0).actionCode()).isEqualTo("COLLECTION_ACCOUNT.CREATED");
        assertThat(audit.entries.get(0).correlationId()).isEqualTo(CORRELATION);
    }

    @Test
    @DisplayName("refuse un canal inconnu")
    void refusesUnknownChannel() {
        CollectionAccountDraft bad =
                new CollectionAccountDraft("BITCOIN", "X", "CNPM", "abc", null, null);
        assertThatThrownBy(() -> service.create(bad, CREATOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
        assertThat(repository.accounts).isEmpty();
    }

    @Test
    @DisplayName("exige le nom de la banque pour un virement")
    void requiresBankNameForTransfer() {
        CollectionAccountDraft bankNoName =
                new CollectionAccountDraft("BANK_TRANSFER", "Compte BDM", "CNPM", "ML00...", null, null);
        assertThatThrownBy(() -> service.create(bankNoName, CREATOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
    }

    @Test
    @DisplayName("refuse deux comptes portant le même numéro sur le même canal")
    void refusesDuplicate() {
        service.create(orangeMoney(), CREATOR, CORRELATION);
        assertThatThrownBy(() -> service.create(orangeMoney(), CREATOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
        assertThat(repository.accounts).hasSize(1);
    }

    @Test
    @DisplayName("valide un brouillon par un autre agent et le rend diffusable")
    void approvesByAnotherAgent() {
        UUID id = UUID.fromString(service.create(orangeMoney(), CREATOR, CORRELATION).id());

        CollectionAccountView.Account approved = service.approve(id, VALIDATOR, CORRELATION);

        assertThat(approved.status()).isEqualTo("ACTIVE");
        assertThat(audit.entries.get(1).actionCode()).isEqualTo("COLLECTION_ACCOUNT.APPROVED");
    }

    @Test
    @DisplayName("interdit à l'auteur de valider son propre compte")
    void refusesSelfApproval() {
        UUID id = UUID.fromString(service.create(orangeMoney(), CREATOR, CORRELATION).id());

        assertThatThrownBy(() -> service.approve(id, CREATOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
        assertThat(repository.accounts.get(id).status()).isEqualTo("DRAFT");
    }

    @Test
    @DisplayName("refuse de valider un compte qui n'est plus un brouillon")
    void refusesApprovingNonDraft() {
        UUID id = UUID.fromString(service.create(orangeMoney(), CREATOR, CORRELATION).id());
        service.approve(id, VALIDATOR, CORRELATION);

        assertThatThrownBy(() -> service.approve(id, VALIDATOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
    }

    @Test
    @DisplayName("désactive un compte actif et le trace")
    void disablesAnActiveAccount() {
        UUID id = UUID.fromString(service.create(orangeMoney(), CREATOR, CORRELATION).id());
        service.approve(id, VALIDATOR, CORRELATION);

        CollectionAccountView.Account disabled =
                service.disable(id, "Numéro changé", VALIDATOR, CORRELATION);

        assertThat(disabled.status()).isEqualTo("DISABLED");
        assertThat(audit.entries.get(2).actionCode()).isEqualTo("COLLECTION_ACCOUNT.DISABLED");
    }

    @Test
    @DisplayName("refuse de désactiver un compte qui n'est pas actif")
    void refusesDisablingADraft() {
        UUID id = UUID.fromString(service.create(orangeMoney(), CREATOR, CORRELATION).id());

        assertThatThrownBy(() -> service.disable(id, "Motif", VALIDATOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
    }

    @Test
    @DisplayName("échoue proprement sur un compte inconnu")
    void failsOnUnknownAccount() {
        UUID unknown = UUID.fromString("55555555-5555-4555-8555-555555555555");
        assertThatThrownBy(() -> service.approve(unknown, VALIDATOR, CORRELATION))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.disable(unknown, "Motif", VALIDATOR, CORRELATION))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    /** Dépôt en mémoire reproduisant les projections de l'adaptateur SQL. */
    private static final class FakeRepository implements CollectionAccountRepository {

        private final Map<UUID, CollectionAccountView.Account> accounts = new LinkedHashMap<>();
        private final Map<UUID, UUID> creators = new LinkedHashMap<>();
        private int sequence;

        @Override
        public List<CollectionAccountView.Account> findAll() {
            return new ArrayList<>(accounts.values());
        }

        @Override
        public Optional<CollectionAccountView.Account> findById(UUID id) {
            return Optional.ofNullable(accounts.get(id));
        }

        @Override
        public boolean existsByChannelAndIdentifier(String channel, String identifier) {
            return accounts.values().stream()
                    .anyMatch(
                            a ->
                                    a.channel().equals(channel)
                                            && a.accountIdentifier().equals(identifier));
        }

        @Override
        public Optional<UUID> creatorOf(UUID id) {
            return Optional.ofNullable(creators.get(id));
        }

        @Override
        public CollectionAccountView.Account create(CollectionAccountDraft draft, UUID actorUserId) {
            UUID id = UUID.fromString("00000000-0000-4000-8000-%012d".formatted(++sequence));
            CollectionAccountView.Account account =
                    new CollectionAccountView.Account(
                            id.toString(),
                            draft.channel(),
                            draft.label(),
                            draft.accountHolder(),
                            draft.accountIdentifier(),
                            draft.bankName(),
                            draft.instructions(),
                            "DRAFT",
                            null,
                            "2026-07-24T00:00:00Z");
            accounts.put(id, account);
            creators.put(id, actorUserId);
            return account;
        }

        @Override
        public CollectionAccountView.Account approve(UUID id, UUID actorUserId) {
            return transition(id, "ACTIVE", "2026-07-24T00:00:00Z");
        }

        @Override
        public CollectionAccountView.Account disable(UUID id, UUID actorUserId) {
            CollectionAccountView.Account current = accounts.get(id);
            return transition(id, "DISABLED", current.approvedAt());
        }

        private CollectionAccountView.Account transition(UUID id, String status, String approvedAt) {
            CollectionAccountView.Account c = accounts.get(id);
            CollectionAccountView.Account updated =
                    new CollectionAccountView.Account(
                            c.id(),
                            c.channel(),
                            c.label(),
                            c.accountHolder(),
                            c.accountIdentifier(),
                            c.bankName(),
                            c.instructions(),
                            status,
                            approvedAt,
                            c.createdAt());
            accounts.put(id, updated);
            return updated;
        }
    }

    /** Journal en mémoire : on n'y vérifie que l'action, l'entité et la corrélation. */
    private static final class RecordingAuditRecorder implements AuditRecorder {
        private final List<AuditEntry> entries = new ArrayList<>();

        @Override
        public void record(AuditEntry entry) {
            entries.add(entry);
        }
    }
}
