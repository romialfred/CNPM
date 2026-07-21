package ml.cnpm.platform.shared.security.mfa;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import ml.cnpm.platform.shared.security.mfa.MfaChallengeService.Challenge;
import ml.cnpm.platform.shared.security.mfa.MfaChallengeService.MfaChallengeException;
import ml.cnpm.platform.shared.security.mfa.MfaChallengeService.Purpose;

class MfaChallengeServiceTest {

    private final MutableClock clock = new MutableClock(Instant.parse("2026-07-21T00:00:00Z"));
    private final MfaChallengeService challenges = new MfaChallengeService(clock);
    private final UUID account = UUID.fromString("00000000-0000-0000-0000-0000000000aa");

    @Test
    @DisplayName("émet puis résout un challenge de même intention")
    void issuesAndRequires() {
        Challenge issued = challenges.issue(account, "user@cnpm.ml", Purpose.VERIFY);
        Challenge resolved = challenges.require(issued.token(), Purpose.VERIFY);
        assertThat(resolved.accountId()).isEqualTo(account);
        assertThat(resolved.login()).isEqualTo("user@cnpm.ml");
    }

    @Test
    @DisplayName("refuse un challenge présenté avec la mauvaise intention")
    void rejectsWrongPurpose() {
        Challenge issued = challenges.issue(account, "user@cnpm.ml", Purpose.ENROLL);
        assertThatThrownBy(() -> challenges.require(issued.token(), Purpose.VERIFY))
                .isInstanceOf(MfaChallengeException.class)
                .hasMessage("MFA_CHALLENGE_INVALID");
    }

    @Test
    @DisplayName("consomme un challenge une seule fois")
    void consumesOnce() {
        Challenge issued = challenges.issue(account, "user@cnpm.ml", Purpose.VERIFY);
        challenges.consume(issued.token());
        assertThatThrownBy(() -> challenges.require(issued.token(), Purpose.VERIFY))
                .isInstanceOf(MfaChallengeException.class);
    }

    @Test
    @DisplayName("expire un challenge après cinq minutes")
    void expiresAfterTtl() {
        Challenge issued = challenges.issue(account, "user@cnpm.ml", Purpose.VERIFY);
        clock.advance(Duration.ofMinutes(6));
        assertThatThrownBy(() -> challenges.require(issued.token(), Purpose.VERIFY))
                .isInstanceOf(MfaChallengeException.class);
    }

    @Test
    @DisplayName("verrouille le challenge après cinq échecs")
    void locksAfterFiveFailures() {
        Challenge issued = challenges.issue(account, "user@cnpm.ml", Purpose.VERIFY);
        for (int i = 0; i < 4; i++) {
            challenges.recordFailure(issued.token());
        }
        assertThatThrownBy(() -> challenges.recordFailure(issued.token()))
                .isInstanceOf(MfaChallengeException.class)
                .hasMessage("MFA_CHALLENGE_LOCKED");
        // Après verrouillage, le token n'existe plus.
        assertThatThrownBy(() -> challenges.require(issued.token(), Purpose.VERIFY))
                .isInstanceOf(MfaChallengeException.class);
    }

    /** Horloge à instant réglable, pour éprouver l'expiration sans attente réelle. */
    private static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        private void advance(Duration duration) {
            this.instant = this.instant.plus(duration);
        }

        @Override
        public Instant instant() {
            return instant;
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }
    }
}
