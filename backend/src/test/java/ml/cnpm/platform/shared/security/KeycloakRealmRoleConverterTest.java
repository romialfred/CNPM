package ml.cnpm.platform.shared.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Cas limites du convertisseur de rôles : une revendication absente ou malformée ne
 * doit jamais accorder d'autorité (refus par défaut), ni lever d'exception qui
 * transformerait un jeton bénin en erreur serveur.
 */
class KeycloakRealmRoleConverterTest {

    private final KeycloakRealmRoleConverter converter = new KeycloakRealmRoleConverter();

    @Test
    @DisplayName("Les rôles de realm deviennent des autorités préfixées ROLE_")
    void mapsRealmRolesToPrefixedAuthorities() {
        Jwt jwt = jwtWith(Map.of("realm_access", Map.of("roles", List.of("COMPTABLE", "SUPPORT"))));

        assertThat(authorities(jwt)).containsExactlyInAnyOrder("ROLE_COMPTABLE", "ROLE_SUPPORT");
    }

    @Test
    @DisplayName("Un jeton sans realm_access n'accorde aucune autorité")
    void grantsNothingWhenRealmAccessMissing() {
        Jwt jwt = jwtWith(Map.of("scope", "openid"));

        assertThat(authorities(jwt)).isEmpty();
    }

    @Test
    @DisplayName("Un realm_access sans liste de rôles n'accorde aucune autorité")
    void grantsNothingWhenRolesMissing() {
        Jwt jwt = jwtWith(Map.of("realm_access", Map.of("other", "value")));

        assertThat(authorities(jwt)).isEmpty();
    }

    @Test
    @DisplayName("Les valeurs de rôle non textuelles sont ignorées sans erreur")
    void ignoresNonStringRoleValues() {
        Jwt jwt = jwtWith(Map.of("realm_access", Map.of("roles", List.of("COMPTABLE", 42, true))));

        assertThat(authorities(jwt)).containsExactly("ROLE_COMPTABLE");
    }

    private List<String> authorities(Jwt jwt) {
        return converter.convert(jwt).stream().map(GrantedAuthority::getAuthority).toList();
    }

    private Jwt jwtWith(Map<String, Object> claims) {
        Jwt.Builder builder =
                Jwt.withTokenValue("token").header("alg", "none").subject("subject");
        claims.forEach(builder::claim);
        return builder.build();
    }
}
