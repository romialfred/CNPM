package ml.cnpm.platform.shared.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Vérifie que les rôles de realm sont dérivés en autorités de permission à partir du
 * mapping réel {@code iam.role_permission} semé par V3.
 *
 * <p>C'est le maillon qui rend l'autorisation par permission possible : sans lui,
 * {@code @PreAuthorize("hasAuthority('PERM_MEMBER.READ')")} ne trouverait jamais son
 * autorité, quelle que soit la richesse des rôles du jeton.
 */
@SpringBootTest
@Testcontainers
class PermissionDerivationTest {

    @Container
    @SuppressWarnings("resource")
    private static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer(DockerImageName.parse("postgres:18.4"));

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.rabbitmq.username", () -> "test");
        registry.add("spring.rabbitmq.password", () -> "test");
        registry.add("management.health.rabbit.enabled", () -> "false");
    }

    @Autowired private PermissionDirectory directory;
    @Autowired private JwtAuthenticationConverter jwtAuthenticationConverter;

    @Test
    void mapsAdminFunctionalRoleToItsSeededPermissions() {
        Set<String> permissions = directory.permissionsFor(Set.of("ADMIN_FONCTIONNEL"));
        assertTrue(permissions.contains("MEMBER.READ"), "ADMIN_FONCTIONNEL doit porter MEMBER.READ");
        assertTrue(
                permissions.contains("ADMIN.REFERENTIAL.READ"),
                "ADMIN_FONCTIONNEL doit porter ADMIN.REFERENTIAL.READ");
    }

    @Test
    void doesNotGrantMemberReadToARoleThatLacksIt() {
        // Contrôle négatif : le seed n'accorde PAS MEMBER.READ à MEMBRE_UTILISATEUR ; la
        // dérivation ne doit donc jamais la lui donner (moindre privilège).
        assertFalse(directory.permissionsFor(Set.of("MEMBRE_UTILISATEUR")).contains("MEMBER.READ"));
    }

    @Test
    void grantsNoPermissionToAnUnknownRole() {
        assertTrue(directory.permissionsFor(Set.of("ROLE_INEXISTANT_XYZ")).isEmpty());
    }

    @Test
    void theWiredConverterBeanDerivesPermissionsFromRealmRoles() {
        // Exerce le bean réellement câblé par SecurityConfig, pas une instance manuelle :
        // si le câblage cessait d'utiliser le convertisseur de permissions, ce test rougirait.
        Jwt jwt =
                Jwt.withTokenValue("t")
                        .header("alg", "none")
                        .subject("u")
                        .claim("realm_access", Map.of("roles", List.of("ADMIN_FONCTIONNEL")))
                        .build();
        Set<String> authorities =
                jwtAuthenticationConverter.convert(jwt).getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toSet());
        assertTrue(authorities.contains("ROLE_ADMIN_FONCTIONNEL"));
        assertTrue(authorities.contains("PERM_MEMBER.READ"));
    }

    @Test
    void convertsRealmRolesIntoRoleAndPermissionAuthorities() {
        Jwt jwt =
                Jwt.withTokenValue("t")
                        .header("alg", "none")
                        .subject("u")
                        .claim("realm_access", Map.of("roles", List.of("ADMIN_FONCTIONNEL")))
                        .build();

        Set<String> authorities =
                new KeycloakAuthoritiesConverter(directory)
                        .convert(jwt).stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(java.util.stream.Collectors.toSet());

        // Le rôle reste exposé ET la permission en est dérivée.
        assertTrue(authorities.contains("ROLE_ADMIN_FONCTIONNEL"));
        assertTrue(authorities.contains("PERM_MEMBER.READ"));
    }

    @Test
    void grantsNoAuthorityWithoutRealmRoles() {
        Jwt jwt = Jwt.withTokenValue("t").header("alg", "none").subject("u").build();
        assertTrue(
                new KeycloakAuthoritiesConverter(directory).convert(jwt).isEmpty(),
                "un jeton sans rôle de realm n'obtient aucune autorité");
        // Garde-fou contre un faux positif de la ligne précédente.
        assertTrue(AuthorityUtils.NO_AUTHORITIES.isEmpty());
    }

    @TestConfiguration
    static class JwtDecoderStub {
        @Bean
        JwtDecoder jwtDecoder() {
            return token -> Jwt.withTokenValue(token).header("alg", "none").subject("test").build();
        }
    }
}
