package ml.cnpm.platform.shared.security.mfa;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import ml.cnpm.platform.shared.security.mfa.MfaChallengeService.Purpose;
import ml.cnpm.platform.shared.security.mfa.MfaService.EnrollmentResult;
import ml.cnpm.platform.shared.security.mfa.MfaService.MfaException;

class MfaServiceTest {

    private final FakeStore store = new FakeStore();
    private final MfaChallengeService challenges = new MfaChallengeService();
    private final TotpService totp = new TotpService();
    private final MfaService service = new MfaService(
            store,
            challenges,
            new CnpmMfaRolePolicy(),
            totp,
            new MfaCryptoService("clé-de-test", new MockEnvironment()),
            Clock.fixed(Instant.parse("2026-07-21T00:00:00Z"), ZoneOffset.UTC));

    private final UUID accountId = UUID.randomUUID();

    private MfaAccount unenrolled() {
        MfaAccount account = new MfaAccount(accountId, "membre@cnpm.ml",
                Set.of("MEMBRE_UTILISATEUR"), false, null, null, null, null);
        store.accounts.put(accountId, account);
        return account;
    }

    private String currentCode(String secret) {
        return TotpService.generateCode(secret, Instant.now().getEpochSecond() / 30);
    }

    @Test
    @DisplayName("enrôle, active le second facteur et délivre huit codes de secours")
    void enrollsAndActivates() {
        unenrolled();
        String enrollToken = challenges.issue(accountId, "membre@cnpm.ml", Purpose.ENROLL).token();

        MfaService.Enrollment enrollment = service.beginEnrollment(enrollToken);
        // Le label issuer:login est URL-encodé (« : » → « %3A »), comme SafeX.
        assertThat(enrollment.otpAuthUri()).startsWith("otpauth://totp/CNPM%3A");
        assertThat(enrollment.otpAuthUri()).contains("issuer=CNPM").contains("secret=");

        EnrollmentResult result = service.confirmEnrollment(enrollToken, currentCode(enrollment.manualKey()));
        assertThat(result.recoveryCodes()).hasSize(8);

        MfaAccount saved = store.accounts.get(accountId);
        assertThat(saved.mfaEnabled()).isTrue();
        assertThat(saved.mfaSecretEncrypted()).isNotNull().startsWith("v1.");
    }

    @Test
    @DisplayName("vérifie un code TOTP puis refuse son rejeu")
    void verifiesThenRejectsReplay() {
        unenrolled();
        String enrollToken = challenges.issue(accountId, "membre@cnpm.ml", Purpose.ENROLL).token();
        MfaService.Enrollment enrollment = service.beginEnrollment(enrollToken);
        service.confirmEnrollment(enrollToken, currentCode(enrollment.manualKey()));

        String code = currentCode(enrollment.manualKey());
        String verifyToken = challenges.issue(accountId, "membre@cnpm.ml", Purpose.VERIFY).token();
        assertThat(service.verify(verifyToken, code, null).mfaEnabled()).isTrue();

        // Même code, nouveau challenge : le pas est déjà consommé → rejet anti-rejeu.
        String replayToken = challenges.issue(accountId, "membre@cnpm.ml", Purpose.VERIFY).token();
        assertThatThrownBy(() -> service.verify(replayToken, code, null))
                .isInstanceOf(MfaException.class)
                .hasMessage("MFA_CODE_INVALID_OR_REPLAYED");
    }

    @Test
    @DisplayName("consomme un code de secours une seule fois")
    void consumesRecoveryCodeOnce() {
        unenrolled();
        String enrollToken = challenges.issue(accountId, "membre@cnpm.ml", Purpose.ENROLL).token();
        MfaService.Enrollment enrollment = service.beginEnrollment(enrollToken);
        String recovery = service.confirmEnrollment(enrollToken, currentCode(enrollment.manualKey()))
                .recoveryCodes().get(0);

        String token1 = challenges.issue(accountId, "membre@cnpm.ml", Purpose.VERIFY).token();
        assertThat(service.verify(token1, "", recovery)).isNotNull();

        String token2 = challenges.issue(accountId, "membre@cnpm.ml", Purpose.VERIFY).token();
        assertThatThrownBy(() -> service.verify(token2, "", recovery)).isInstanceOf(MfaException.class);
    }

    @Test
    @DisplayName("refuse d'enrôler un compte déjà enrôlé")
    void refusesDoubleEnrollment() {
        MfaAccount account = unenrolled();
        account.applyEnrollment("v1.x.y", "hash", Instant.now());
        String token = challenges.issue(accountId, "membre@cnpm.ml", Purpose.ENROLL).token();
        assertThatThrownBy(() -> service.beginEnrollment(token))
                .isInstanceOf(MfaException.class)
                .hasMessage("MFA_ENROLLMENT_NOT_ALLOWED");
    }

    private static final class FakeStore implements MfaAccountStore {
        private final Map<UUID, MfaAccount> accounts = new HashMap<>();

        @Override
        public Optional<MfaAccount> findById(UUID id) {
            return Optional.ofNullable(accounts.get(id));
        }

        @Override
        public void save(MfaAccount account) {
            accounts.put(account.id(), account);
        }
    }
}
