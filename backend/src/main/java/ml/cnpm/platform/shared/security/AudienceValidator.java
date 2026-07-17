package ml.cnpm.platform.shared.security;

import java.util.List;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Rejette tout jeton dont l'audience ne contient pas au moins une valeur attendue.
 *
 * <p>Dans un realm Keycloak partagé par plusieurs clients (web, mobile, tiers), la
 * seule validation d'émetteur et de signature laisserait passer un jeton émis pour
 * un autre client mais porteur des bons rôles de realm. La validation d'audience
 * ferme cette voie ; elle est exigée avant toute connexion à un Keycloak réel
 * (voir ADR-008).
 */
public final class AudienceValidator implements OAuth2TokenValidator<Jwt> {

    private static final OAuth2Error INVALID_AUDIENCE =
            new OAuth2Error(
                    "invalid_token", "L'audience requise du jeton est absente.", null);

    private final List<String> expectedAudiences;

    public AudienceValidator(List<String> expectedAudiences) {
        this.expectedAudiences = List.copyOf(expectedAudiences);
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt token) {
        List<String> audience = token.getAudience();
        if (audience != null && audience.stream().anyMatch(expectedAudiences::contains)) {
            return OAuth2TokenValidatorResult.success();
        }
        return OAuth2TokenValidatorResult.failure(INVALID_AUDIENCE);
    }
}
