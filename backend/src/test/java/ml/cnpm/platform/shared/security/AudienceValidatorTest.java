package ml.cnpm.platform.shared.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Un jeton n'est accepté que si son audience contient une valeur attendue ; sinon
 * il est rejeté. C'est la garantie qui empêche un jeton émis pour un autre client du
 * même realm d'être accepté.
 */
class AudienceValidatorTest {

    private final AudienceValidator validator = new AudienceValidator(List.of("cnpm-backend"));

    @Test
    @DisplayName("Un jeton portant l'audience attendue est accepté")
    void acceptsExpectedAudience() {
        assertThat(validator.validate(jwtWithAudience(List.of("cnpm-backend"))).hasErrors()).isFalse();
    }

    @Test
    @DisplayName("Un jeton pour un autre client est rejeté")
    void rejectsForeignAudience() {
        assertThat(validator.validate(jwtWithAudience(List.of("autre-client"))).hasErrors()).isTrue();
    }

    @Test
    @DisplayName("Un jeton sans audience est rejeté")
    void rejectsMissingAudience() {
        assertThat(validator.validate(jwtWithAudience(List.of())).hasErrors()).isTrue();
    }

    private Jwt jwtWithAudience(List<String> audience) {
        return new Jwt(
                "token",
                Instant.now(),
                Instant.now().plusSeconds(60),
                Map.of("alg", "none"),
                Map.of("aud", audience, "sub", "subject"));
    }
}
