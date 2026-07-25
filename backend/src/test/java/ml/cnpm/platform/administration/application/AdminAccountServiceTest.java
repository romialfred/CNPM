package ml.cnpm.platform.administration.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.administration.application.port.out.AdminAccountRepository;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Règles de la vie d'un compte, éprouvées sans base ni HTTP.
 *
 * <p>Ce qui est vérifié ici, ce sont les décisions du service : idempotence d'une
 * création rejouée, refus d'un doublon divergent, cohérence du lien d'adhésion,
 * impossibilité de s'auto-suspendre, absence de trace pour une action sans effet, et
 * présence d'une trace corrélée pour chaque action réelle. La chaîne HTTP et les
 * autorisations sont couvertes séparément par {@code AdminAccountApiTest}.
 */
class AdminAccountServiceTest {

    private static final UUID ROLE = UUID.fromString("11111111-1111-4111-8111-111111111111");
    private static final UUID ACTOR = UUID.fromString("22222222-2222-4222-8222-222222222222");
    private static final UUID MEMBER = UUID.fromString("33333333-3333-4333-8333-333333333333");
    private static final UUID CORRELATION = UUID.fromString("44444444-4444-4444-8444-444444444444");

    private final FakeRepository repository = new FakeRepository();
    private final RecordingAuditRecorder audit = new RecordingAuditRecorder();
    private final AdminAccountService service = new AdminAccountService(repository, audit);

    private static AdminAccountDraft professional() {
        return new AdminAccountDraft(
                AdminAccountDraft.TYPE_PROFESSIONAL,
                "Aminata",
                "Coulibaly",
                "Aminata.Coulibaly@example.test",
                "+223 70 00 00 00",
                "Chargée de recouvrement",
                "CNPM",
                "Recouvrement",
                ROLE,
                null);
    }

    @Test
    @DisplayName("crée un compte invité, sans second facteur, et le trace")
    void createsAnInvitedAccount() {
        AdminAccountCreation outcome = service.create(professional(), ACTOR, CORRELATION);

        assertThat(outcome.created()).isTrue();
        assertThat(outcome.account().status()).isEqualTo("INVITED");
        assertThat(outcome.account().twoFactor()).isEqualTo("PENDING");
        // L'adresse sert d'identité de connexion : elle est normalisée, la casse saisie ne
        // doit pas pouvoir créer deux comptes distincts.
        assertThat(outcome.account().email()).isEqualTo("aminata.coulibaly@example.test");
        assertThat(audit.entries).hasSize(1);
        assertThat(audit.entries.get(0).actionCode()).isEqualTo("USER_ACCOUNT.CREATED");
        assertThat(audit.entries.get(0).correlationId()).isEqualTo(CORRELATION);
        assertThat(audit.entries.get(0).actorUserId()).isEqualTo(ACTOR);
    }

    @Test
    @DisplayName("rejoue une création identique sans créer de doublon ni de seconde trace")
    void replaysAnIdenticalCreation() {
        service.create(professional(), ACTOR, CORRELATION);
        AdminAccountCreation replay = service.create(professional(), ACTOR, CORRELATION);

        assertThat(replay.created()).isFalse();
        assertThat(repository.accounts).hasSize(1);
        assertThat(audit.entries).hasSize(1);
    }

    @Test
    @DisplayName("refuse une adresse déjà prise par un compte au contenu différent")
    void rejectsADivergentDuplicate() {
        service.create(professional(), ACTOR, CORRELATION);

        AdminAccountDraft other =
                new AdminAccountDraft(
                        AdminAccountDraft.TYPE_PROFESSIONAL,
                        "Boubacar",
                        "Traoré",
                        "aminata.coulibaly@example.test",
                        null,
                        null,
                        null,
                        null,
                        ROLE,
                        null);

        assertThatThrownBy(() -> service.create(other, ACTOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
        assertThat(repository.accounts).hasSize(1);
    }

    @Test
    @DisplayName("refuse un rôle inconnu")
    void rejectsAnUnknownRole() {
        AdminAccountDraft unknownRole =
                new AdminAccountDraft(
                        AdminAccountDraft.TYPE_PROFESSIONAL,
                        "Aminata",
                        "Coulibaly",
                        "aminata@example.test",
                        null,
                        null,
                        null,
                        null,
                        UUID.fromString("99999999-9999-4999-8999-999999999999"),
                        null);

        assertThatThrownBy(() -> service.create(unknownRole, ACTOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
        assertThat(audit.entries).isEmpty();
    }

    @Test
    @DisplayName("exige une adhésion pour un compte membre, et l'interdit à un compte professionnel")
    void enforcesTheMemberLink() {
        AdminAccountDraft memberWithoutMembership =
                new AdminAccountDraft(
                        AdminAccountDraft.TYPE_MEMBER, "Fatoumata", "Diallo",
                        "fatoumata@example.test", null, null, null, null, ROLE, null);
        AdminAccountDraft professionalWithMembership =
                new AdminAccountDraft(
                        AdminAccountDraft.TYPE_PROFESSIONAL, "Fatoumata", "Diallo",
                        "fatoumata2@example.test", null, null, null, null, ROLE, MEMBER);

        assertThatThrownBy(() -> service.create(memberWithoutMembership, ACTOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
        assertThatThrownBy(() -> service.create(professionalWithMembership, ACTOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
        assertThat(repository.accounts).isEmpty();
    }

    @Test
    @DisplayName("suspend un compte et consigne l'action avec son empreinte de motif")
    void suspendsAnAccount() {
        String id = service.create(professional(), ACTOR, CORRELATION).account().id();

        AdminSecurityView.Account suspended =
                service.changeStatus(
                        UUID.fromString(id), "SUSPENDED", "Départ de l'organisation", ACTOR, CORRELATION);

        assertThat(suspended.status()).isEqualTo("SUSPENDED");
        assertThat(audit.entries).hasSize(2);
        AuditEntry entry = audit.entries.get(1);
        assertThat(entry.actionCode()).isEqualTo("USER_ACCOUNT.SUSPENDED");
        assertThat(entry.beforeHash()).isNotEqualTo(entry.afterHash());
        // Le motif ne rejoint jamais le journal en clair : seule son empreinte le lie à l'action.
        assertThat(entry.afterHash()).doesNotContain("Départ");
    }

    @Test
    @DisplayName("ne consigne rien lorsqu'une suspension déjà appliquée est rejouée")
    void ignoresARepeatedSuspension() {
        UUID id = UUID.fromString(service.create(professional(), ACTOR, CORRELATION).account().id());
        service.changeStatus(id, "SUSPENDED", "Départ", ACTOR, CORRELATION);

        service.changeStatus(id, "SUSPENDED", "Départ", ACTOR, CORRELATION);

        assertThat(audit.entries).hasSize(2);
    }

    @Test
    @DisplayName("réactive un compte suspendu")
    void reactivatesAnAccount() {
        UUID id = UUID.fromString(service.create(professional(), ACTOR, CORRELATION).account().id());
        service.changeStatus(id, "SUSPENDED", "Départ", ACTOR, CORRELATION);

        AdminSecurityView.Account reactivated =
                service.changeStatus(id, "ACTIVE", "Retour de mission", ACTOR, CORRELATION);

        assertThat(reactivated.status()).isNotEqualTo("SUSPENDED");
        assertThat(audit.entries.get(2).actionCode()).isEqualTo("USER_ACCOUNT.REACTIVATED");
    }

    @Test
    @DisplayName("interdit à un opérateur de suspendre son propre compte")
    void refusesSelfSuspension() {
        UUID id = UUID.fromString(service.create(professional(), ACTOR, CORRELATION).account().id());

        assertThatThrownBy(() -> service.changeStatus(id, "SUSPENDED", "Erreur", id, CORRELATION))
                .isInstanceOf(StateConflictException.class);
        assertThat(repository.accounts.get(id).status()).isEqualTo("INVITED");
    }

    @Test
    @DisplayName("refuse un état de compte hors du jeu autorisé")
    void refusesAnUnsupportedStatus() {
        UUID id = UUID.fromString(service.create(professional(), ACTOR, CORRELATION).account().id());

        assertThatThrownBy(() -> service.changeStatus(id, "SUPPRIME", "Motif", ACTOR, CORRELATION))
                .isInstanceOf(StateConflictException.class);
    }

    @Test
    @DisplayName("échoue proprement sur un compte inconnu")
    void failsOnAnUnknownAccount() {
        UUID unknown = UUID.fromString("55555555-5555-4555-8555-555555555555");

        assertThatThrownBy(() -> service.changeStatus(unknown, "SUSPENDED", "Motif", ACTOR, CORRELATION))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.resetTwoFactor(unknown, "Motif", ACTOR, CORRELATION))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("supprime un compte et consigne l'action avant que l'entité disparaisse")
    void deletesAnAccount() {
        UUID id = UUID.fromString(service.create(professional(), ACTOR, CORRELATION).account().id());

        service.delete(id, "Doublon créé par erreur", ACTOR, CORRELATION);

        assertThat(repository.accounts).doesNotContainKey(id);
        assertThat(audit.entries.get(1).actionCode()).isEqualTo("USER_ACCOUNT.DELETED");
        assertThat(audit.entries.get(1).entityId()).isEqualTo(id);
    }

    @Test
    @DisplayName("interdit à un opérateur de supprimer son propre compte")
    void refusesSelfDeletion() {
        UUID id = UUID.fromString(service.create(professional(), ACTOR, CORRELATION).account().id());

        assertThatThrownBy(() -> service.delete(id, "Erreur", id, CORRELATION))
                .isInstanceOf(StateConflictException.class);
        assertThat(repository.accounts).containsKey(id);
    }

    @Test
    @DisplayName("échoue à supprimer un compte inconnu")
    void failsToDeleteUnknownAccount() {
        assertThatThrownBy(
                        () ->
                                service.delete(
                                        UUID.fromString("55555555-5555-4555-8555-555555555555"),
                                        "Motif",
                                        ACTOR,
                                        CORRELATION))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("réinitialise le second facteur et le repasse en attente d'enrôlement")
    void resetsTheSecondFactor() {
        UUID id = UUID.fromString(service.create(professional(), ACTOR, CORRELATION).account().id());
        repository.enableTwoFactor(id);

        AdminSecurityView.Account reset =
                service.resetTwoFactor(id, "Téléphone perdu", ACTOR, CORRELATION);

        assertThat(reset.twoFactor()).isEqualTo("PENDING");
        assertThat(audit.entries.get(1).actionCode()).isEqualTo("USER_ACCOUNT.MFA_RESET");
        assertThat(audit.entries.get(1).entityId()).isEqualTo(id);
    }

    /** Dépôt en mémoire reproduisant les projections que l'adaptateur SQL renvoie. */
    private static final class FakeRepository implements AdminAccountRepository {

        private final Map<UUID, AdminSecurityView.Account> accounts = new LinkedHashMap<>();
        private int sequence;

        @Override
        public Optional<AdminSecurityView.Account> findByEmail(String email) {
            return accounts.values().stream()
                    .filter(account -> account.email().equalsIgnoreCase(email))
                    .findFirst();
        }

        @Override
        public Optional<AdminSecurityView.Account> findById(UUID id) {
            return Optional.ofNullable(accounts.get(id));
        }

        @Override
        public boolean roleExists(UUID roleId) {
            return ROLE.equals(roleId);
        }

        @Override
        public AdminSecurityView.Account create(AdminAccountDraft draft, UUID actorUserId) {
            UUID id = UUID.fromString("00000000-0000-4000-8000-%012d".formatted(++sequence));
            AdminSecurityView.Account account =
                    new AdminSecurityView.Account(
                            id.toString(),
                            draft.displayName(),
                            draft.normalizedEmail(),
                            draft.roleId().toString(),
                            "Rôle",
                            draft.accountType(),
                            blankToNull(draft.phone()),
                            blankToNull(draft.jobTitle()),
                            blankToNull(draft.organization()),
                            blankToNull(draft.department()),
                            "INVITED",
                            "PENDING",
                            null,
                            null,
                            0);
            accounts.put(id, account);
            return account;
        }

        @Override
        public AdminSecurityView.Account updateStatus(UUID id, String status, UUID actorUserId) {
            AdminSecurityView.Account current = accounts.get(id);
            // Comme en base : un compte réactivé qui ne s'est jamais connecté redevient
            // « invité », il ne devient pas actif par le seul effet de la réactivation.
            String projected =
                    "SUSPENDED".equals(status)
                            ? "SUSPENDED"
                            : current.lastLoginAt() == null ? "INVITED" : "ACTIVE";
            return replace(id, withStatus(current, projected, current.twoFactor()));
        }

        @Override
        public AdminSecurityView.Account resetTwoFactor(UUID id, UUID actorUserId) {
            AdminSecurityView.Account current = accounts.get(id);
            return replace(id, withStatus(current, current.status(), "PENDING"));
        }

        @Override
        public void delete(UUID id) {
            accounts.remove(id);
        }

        void enableTwoFactor(UUID id) {
            AdminSecurityView.Account current = accounts.get(id);
            replace(id, withStatus(current, "ACTIVE", "ENABLED"));
        }

        private AdminSecurityView.Account replace(UUID id, AdminSecurityView.Account account) {
            accounts.put(id, account);
            return account;
        }

        private static AdminSecurityView.Account withStatus(
                AdminSecurityView.Account account, String status, String twoFactor) {
            return new AdminSecurityView.Account(
                    account.id(),
                    account.fullName(),
                    account.email(),
                    account.roleId(),
                    account.roleLabel(),
                    account.accountType(),
                    account.phone(),
                    account.jobTitle(),
                    account.organization(),
                    account.department(),
                    status,
                    twoFactor,
                    account.lastLoginAt(),
                    account.lastLoginLabel(),
                    account.activeSessions());
        }

        private static String blankToNull(String value) {
            return value == null || value.isBlank() ? null : value.trim();
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
