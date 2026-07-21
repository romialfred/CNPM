package ml.cnpm.platform.shared.security.mfa;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/**
 * Vue mutable de l'état MFA d'un compte, manipulée par {@link MfaService} puis persistée
 * par un {@link MfaAccountStore}. Elle isole la logique du second facteur du mapping JPA :
 * le service ne connaît que cet objet, jamais l'entité de persistance.
 */
public final class MfaAccount {

    private final UUID id;
    private final String login;
    private final Set<String> roles;
    private boolean mfaEnabled;
    private String mfaSecretEncrypted;
    private String mfaRecoveryCodeHashes;
    private Long mfaLastAcceptedStep;
    private Instant mfaEnrolledAt;

    public MfaAccount(UUID id, String login, Set<String> roles, boolean mfaEnabled,
            String mfaSecretEncrypted, String mfaRecoveryCodeHashes, Long mfaLastAcceptedStep,
            Instant mfaEnrolledAt) {
        this.id = id;
        this.login = login;
        this.roles = roles == null ? Set.of() : Set.copyOf(roles);
        this.mfaEnabled = mfaEnabled;
        this.mfaSecretEncrypted = mfaSecretEncrypted;
        this.mfaRecoveryCodeHashes = mfaRecoveryCodeHashes;
        this.mfaLastAcceptedStep = mfaLastAcceptedStep;
        this.mfaEnrolledAt = mfaEnrolledAt;
    }

    public UUID id() {
        return id;
    }

    public String login() {
        return login;
    }

    public Set<String> roles() {
        return roles;
    }

    public boolean mfaEnabled() {
        return mfaEnabled;
    }

    public String mfaSecretEncrypted() {
        return mfaSecretEncrypted;
    }

    public String mfaRecoveryCodeHashes() {
        return mfaRecoveryCodeHashes;
    }

    public Long mfaLastAcceptedStep() {
        return mfaLastAcceptedStep;
    }

    public Instant mfaEnrolledAt() {
        return mfaEnrolledAt;
    }

    void applyEnrollment(String secretEncrypted, String recoveryHashes, Instant enrolledAt) {
        this.mfaSecretEncrypted = secretEncrypted;
        this.mfaRecoveryCodeHashes = recoveryHashes;
        this.mfaLastAcceptedStep = null;
        this.mfaEnrolledAt = enrolledAt;
        this.mfaEnabled = true;
    }

    void recordAcceptedStep(long step) {
        this.mfaLastAcceptedStep = step;
    }

    void replaceRecoveryHashes(String remainingHashes) {
        this.mfaRecoveryCodeHashes = remainingHashes;
    }
}
