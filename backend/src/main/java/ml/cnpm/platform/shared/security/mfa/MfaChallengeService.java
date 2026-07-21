package ml.cnpm.platform.shared.security.mfa;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

/**
 * Challenges opaques émis APRÈS validation du mot de passe : courts, mono-usage et limités
 * à cinq essais. Ils portent l'intention (enrôler / vérifier) sans transiter par l'URL.
 * Porté du {@code MfaChallengeService} de SafeX (AUTH-DEC-020) ; l'identifiant de compte
 * est un {@link UUID}, aligné sur les clés techniques du schéma {@code iam}.
 */
@Service
public class MfaChallengeService {

    public enum Purpose { ENROLL, VERIFY }

    public record Challenge(String token, UUID accountId, String login, Purpose purpose, Instant expiresAt) { }

    private static final Duration TTL = Duration.ofMinutes(5);
    private static final int MAX_ATTEMPTS = 5;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, State> challenges = new ConcurrentHashMap<>();
    private final Clock clock;

    public MfaChallengeService() {
        this(Clock.systemUTC());
    }

    MfaChallengeService(Clock clock) {
        this.clock = clock;
    }

    public Challenge issue(UUID accountId, String login, Purpose purpose) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expiresAt = clock.instant().plus(TTL);
        challenges.put(token, new State(accountId, login, purpose, expiresAt));
        return new Challenge(token, accountId, login, purpose, expiresAt);
    }

    public synchronized Challenge require(String token, Purpose purpose) {
        State state = challenges.get(token);
        if (state == null || state.used || state.expiresAt.isBefore(clock.instant()) || state.purpose != purpose) {
            if (state != null) {
                challenges.remove(token);
            }
            throw new MfaChallengeException("MFA_CHALLENGE_INVALID");
        }
        return new Challenge(token, state.accountId, state.login, state.purpose, state.expiresAt);
    }

    public synchronized void recordFailure(String token) {
        State state = challenges.get(token);
        if (state == null) {
            throw new MfaChallengeException("MFA_CHALLENGE_INVALID");
        }
        state.attempts++;
        if (state.attempts >= MAX_ATTEMPTS) {
            challenges.remove(token);
            throw new MfaChallengeException("MFA_CHALLENGE_LOCKED");
        }
    }

    public synchronized void consume(String token) {
        State state = challenges.remove(token);
        if (state == null || state.used || state.expiresAt.isBefore(clock.instant())) {
            throw new MfaChallengeException("MFA_CHALLENGE_INVALID");
        }
        state.used = true;
    }

    public static final class MfaChallengeException extends RuntimeException {
        private static final long serialVersionUID = 1L;

        public MfaChallengeException(String code) {
            super(code);
        }
    }

    private static final class State {
        private final UUID accountId;
        private final String login;
        private final Purpose purpose;
        private final Instant expiresAt;
        private int attempts;
        private boolean used;

        private State(UUID accountId, String login, Purpose purpose, Instant expiresAt) {
            this.accountId = accountId;
            this.login = login;
            this.purpose = purpose;
            this.expiresAt = expiresAt;
        }
    }
}
