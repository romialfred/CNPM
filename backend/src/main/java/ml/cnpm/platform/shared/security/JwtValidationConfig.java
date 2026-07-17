package ml.cnpm.platform.shared.security;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

/**
 * Décodeur JWT durci : validation d'émetteur (défaut Spring) **et** d'audience.
 *
 * <p>Actif uniquement quand {@code cnpm.security.jwt.expected-audiences} est
 * renseigné — c'est-à-dire une fois le client Keycloak provisionné. Tant que la
 * propriété est absente, Spring construit son décodeur par défaut (émetteur seul) ;
 * cet état transitoire est assumé et suivi dans ADR-008. En le fournissant sous
 * condition, on n'impose pas d'appel réseau vers Keycloak aux tests, qui ne
 * positionnent pas la propriété et fournissent leur propre décodeur.
 */
@Configuration
@ConditionalOnProperty(prefix = "cnpm.security.jwt", name = "expected-audiences")
public class JwtValidationConfig {

    @Bean
    JwtDecoder jwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuerUri,
            @Value("${cnpm.security.jwt.expected-audiences}") List<String> expectedAudiences) {
        NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation(issuerUri);
        OAuth2TokenValidator<Jwt> validator =
                new DelegatingOAuth2TokenValidator<>(
                        JwtValidators.createDefaultWithIssuer(issuerUri),
                        new AudienceValidator(expectedAudiences));
        decoder.setJwtValidator(validator);
        return decoder;
    }
}
