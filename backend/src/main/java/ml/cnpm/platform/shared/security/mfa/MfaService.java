package ml.cnpm.platform.shared.security.mfa;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import ml.cnpm.platform.shared.security.mfa.MfaChallengeService.Challenge;
import ml.cnpm.platform.shared.security.mfa.MfaChallengeService.Purpose;

/**
 * Enrôlement, vérification TOTP et codes de secours mono-usage — orchestration du second
 * facteur natif (AUTH-DEC-020). Portée du {@code MfaService} de SafeX, câblée sur le port
 * {@link MfaAccountStore} (aucune dépendance à la base ni à un framework de persistance).
 */
@Service
public class MfaService {

    public record Enrollment(String manualKey, String otpAuthUri) { }

    /** Résultat de l'activation : codes de secours + compte activé (pour émettre le jeton). */
    public record EnrollmentResult(List<String> recoveryCodes, MfaAccount account) { }

    private static final int RECOVERY_CODE_COUNT = 8;
    private static final String ISSUER = "CNPM";

    private final MfaAccountStore accounts;
    private final MfaChallengeService challenges;
    private final CnpmMfaRolePolicy rolePolicy;
    private final TotpService totp;
    private final MfaCryptoService crypto;
    private final Clock clock;
    private final BCryptPasswordEncoder recoveryEncoder = new BCryptPasswordEncoder(10);
    private final SecureRandom random = new SecureRandom();
    private final Map<String, String> pendingSecrets = new ConcurrentHashMap<>();

    // Deux constructeurs coexistent (le second injecte une Clock pour les tests) : Spring
    // ne peut pas deviner lequel utiliser, d'où l'annotation explicite du constructeur de prod.
    @Autowired
    public MfaService(MfaAccountStore accounts, MfaChallengeService challenges,
            CnpmMfaRolePolicy rolePolicy, TotpService totp, MfaCryptoService crypto) {
        this(accounts, challenges, rolePolicy, totp, crypto, Clock.systemUTC());
    }

    MfaService(MfaAccountStore accounts, MfaChallengeService challenges, CnpmMfaRolePolicy rolePolicy,
            TotpService totp, MfaCryptoService crypto, Clock clock) {
        this.accounts = accounts;
        this.challenges = challenges;
        this.rolePolicy = rolePolicy;
        this.totp = totp;
        this.crypto = crypto;
        this.clock = clock;
    }

    public Enrollment beginEnrollment(String challengeToken) {
        Challenge challenge = challenges.require(challengeToken, Purpose.ENROLL);
        MfaAccount account = account(challenge.accountId());
        if (!rolePolicy.requiresMfa(account.roles()) || account.mfaEnabled()) {
            throw new MfaException("MFA_ENROLLMENT_NOT_ALLOWED");
        }
        String secret = pendingSecrets.computeIfAbsent(challengeToken, ignored -> totp.newSecret());
        String label = url(ISSUER + ":" + challenge.login());
        String uri = "otpauth://totp/" + label + "?secret=" + secret
                + "&issuer=" + url(ISSUER) + "&algorithm=SHA1&digits=6&period=30";
        return new Enrollment(secret, uri);
    }

    public synchronized EnrollmentResult confirmEnrollment(String challengeToken, String code) {
        Challenge challenge = challenges.require(challengeToken, Purpose.ENROLL);
        String secret = pendingSecrets.get(challengeToken);
        if (secret == null) {
            throw new MfaException("MFA_ENROLLMENT_NOT_STARTED");
        }
        if (totp.validate(secret, code) < 0) {
            challenges.recordFailure(challengeToken);
            throw new MfaException("MFA_CODE_INVALID");
        }
        MfaAccount account = account(challenge.accountId());
        if (!rolePolicy.requiresMfa(account.roles())) {
            throw new MfaException("MFA_ENROLLMENT_NOT_ALLOWED");
        }
        List<String> recoveryCodes = newRecoveryCodes();
        account.applyEnrollment(crypto.encrypt(secret), hashRecoveryCodes(recoveryCodes), clock.instant());
        accounts.save(account);
        pendingSecrets.remove(challengeToken);
        challenges.consume(challengeToken);
        return new EnrollmentResult(List.copyOf(recoveryCodes), account);
    }

    public synchronized MfaAccount verify(String challengeToken, String code, String recoveryCode) {
        Challenge challenge = challenges.require(challengeToken, Purpose.VERIFY);
        MfaAccount account = account(challenge.accountId());
        if (!account.mfaEnabled() || account.mfaSecretEncrypted() == null) {
            throw new MfaException("MFA_NOT_ENROLLED");
        }

        boolean valid;
        if (recoveryCode != null && !recoveryCode.isBlank()) {
            valid = consumeRecoveryCode(account, recoveryCode);
        } else {
            long step = totp.validate(crypto.decrypt(account.mfaSecretEncrypted()), code);
            valid = step >= 0
                    && (account.mfaLastAcceptedStep() == null || step > account.mfaLastAcceptedStep());
            if (valid) {
                account.recordAcceptedStep(step);
            }
        }
        if (!valid) {
            challenges.recordFailure(challengeToken);
            throw new MfaException("MFA_CODE_INVALID_OR_REPLAYED");
        }
        accounts.save(account);
        challenges.consume(challengeToken);
        return account;
    }

    private boolean consumeRecoveryCode(MfaAccount account, String candidate) {
        String normalized = normalizeRecoveryCode(candidate);
        if (normalized.length() < 12 || account.mfaRecoveryCodeHashes() == null) {
            return false;
        }
        List<String> hashes = new ArrayList<>(List.of(account.mfaRecoveryCodeHashes().split("\\n")));
        for (int i = 0; i < hashes.size(); i++) {
            if (recoveryEncoder.matches(normalized, hashes.get(i))) {
                hashes.remove(i);
                account.replaceRecoveryHashes(String.join("\n", hashes));
                return true;
            }
        }
        return false;
    }

    private List<String> newRecoveryCodes() {
        List<String> codes = new ArrayList<>();
        for (int i = 0; i < RECOVERY_CODE_COUNT; i++) {
            byte[] bytes = new byte[10];
            random.nextBytes(bytes);
            String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
                    .replace('-', 'A').replace('_', 'B').toUpperCase();
            codes.add(raw.substring(0, 8) + "-" + raw.substring(8, 14));
        }
        return codes;
    }

    private String hashRecoveryCodes(List<String> codes) {
        return codes.stream()
                .map(MfaService::normalizeRecoveryCode)
                .map(recoveryEncoder::encode)
                .reduce((left, right) -> left + "\n" + right)
                .orElse("");
    }

    private MfaAccount account(UUID id) {
        return accounts.findById(id).orElseThrow(() -> new MfaException("MFA_CHALLENGE_INVALID"));
    }

    private static String normalizeRecoveryCode(String code) {
        return code == null ? "" : code.toUpperCase().replaceAll("[^A-Z0-9]", "");
    }

    private static String url(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    public static final class MfaException extends RuntimeException {
        private static final long serialVersionUID = 1L;

        public MfaException(String code) {
            super(code);
        }
    }
}
