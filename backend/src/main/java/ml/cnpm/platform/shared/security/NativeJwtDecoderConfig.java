package ml.cnpm.platform.shared.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

/**
 * Décodeur du jeton de session NATIF (AUTH-DEC-020).
 *
 * <p>Quand {@code cnpm.security.native-jwt.enabled=true}, le resource-server valide les
 * jetons HS256 émis par {@link AppTokenService} au lieu de ceux de Keycloak — c'est la
 * bascule « adieu Keycloak » pour l'accès aux API. En définissant ce {@link JwtDecoder},
 * l'auto-configuration liée à {@code issuer-uri} se retire (ConditionalOnMissingBean).
 *
 * <p>Gardé par une propriété pour n'activer la bascule qu'explicitement : par défaut, le
 * comportement resource-server d'origine est conservé.
 */
@Configuration
@ConditionalOnProperty(name = "cnpm.security.native-jwt.enabled", havingValue = "true")
public class NativeJwtDecoderConfig {

    @Bean
    JwtDecoder jwtDecoder(AppTokenService tokens) {
        return NimbusJwtDecoder.withSecretKey(tokens.macKey())
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }
}
