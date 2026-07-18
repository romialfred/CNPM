package ml.cnpm.platform.shared.security;

import static org.mockito.Mockito.mock;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Test d'intégration de la politique de sécurité HTTP contre le contexte applicatif
 * réel : refus par défaut, endpoints publics, projection des rôles Keycloak et
 * erreurs normalisées.
 *
 * <p>Le contexte complet démarre avec un PostgreSQL Testcontainers (JPA/Flyway du
 * monolithe) ; seul le {@link JwtDecoder} est remplacé par un mock. Ces tests
 * couvrent les règles d'autorisation (refus par défaut, 401, 403, mapping de rôles)
 * sur la vraie chaîne de filtres, sans réseau. Ils ne couvrent PAS la validation
 * cryptographique du jeton (signature, émetteur, audience) : aucun test d'intégration
 * Keycloak n'existe encore, et {@code AudienceValidator} n'est pas exercé ici. Cette
 * lacune est suivie dans ADR-008 et le scorecard.
 */
@SpringBootTest
class SecurityConfigTest {

    @SuppressWarnings("resource")
    private static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer(DockerImageName.parse("postgres:18.4"));

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        // Aucun émetteur réel : le JwtDecoder est fourni en mock par la config de test.
        registry.add("spring.security.oauth2.resourceserver.jwt.issuer-uri", () -> "");
    }

    @TestConfiguration
    static class MockDecoder {
        /** Évite tout appel réseau vers Keycloak au démarrage du contexte. */
        @Bean
        JwtDecoder jwtDecoder() {
            return mock(JwtDecoder.class);
        }

        /**
         * Endpoint protégé par rôle, uniquement en test, pour éprouver l'autorisation
         * verticale (403) tant qu'aucun cas d'usage métier réel n'est encore exposé.
         */
        @Bean
        RoleGatedController roleGatedController() {
            return new RoleGatedController();
        }
    }

    @org.springframework.web.bind.annotation.RestController
    static class RoleGatedController {
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN_SECURITE')")
        @org.springframework.web.bind.annotation.GetMapping("/test/admin-only")
        String adminOnly() {
            return "ok";
        }
    }

    @Autowired private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        // MockMvc est construit à la main : en Boot 4.1, @AutoConfigureMockMvc vit
        // dans un module de slice web non tiré par spring-boot-starter-test. Le
        // filtre de sécurité est appliqué explicitement via springSecurity().
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    @DisplayName("Sans jeton, une route protégée renvoie 401 au format Problem")
    void protectedRouteWithoutTokenIsUnauthorized() throws Exception {
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.correlationId").isNotEmpty())
                .andExpect(header().exists(ProblemResponseWriterHeader.CORRELATION))
                // L'encodage doit être UTF-8 : sans lui le conteneur retombe sur ISO-8859-1
                // et le message français ressort avec des accents cassés (« expir?e »).
                .andExpect(
                        content()
                                .contentTypeCompatibleWith(
                                        org.springframework.http.MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertTrue(
                        result.getResponse().getContentType().toLowerCase().contains("utf-8"),
                        "Content-Type doit porter charset=UTF-8, obtenu : "
                                + result.getResponse().getContentType()))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("expirée")));
    }

    @Test
    @DisplayName("Le correlationId fourni par le client est repris dans l'erreur")
    void correlationIdFromClientIsEchoed() throws Exception {
        String correlationId = "11111111-1111-1111-1111-111111111111";
        mockMvc.perform(get("/auth/me").header(ProblemResponseWriterHeader.CORRELATION, correlationId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.correlationId").value(correlationId))
                .andExpect(header().string(ProblemResponseWriterHeader.CORRELATION, correlationId));
    }

    @Test
    @DisplayName("Avec un jeton valide, /auth/me projette identité et rôles de realm")
    void authenticatedUserSeesTheirRoles() throws Exception {
        mockMvc.perform(
                        get("/auth/me")
                                .with(
                                        jwt().jwt(
                                                        builder ->
                                                                builder.subject("user-123")
                                                                        .claim(
                                                                                "preferred_username",
                                                                                "acomptable")
                                                                        .claim(
                                                                                "realm_access",
                                                                                Map.of(
                                                                                        "roles",
                                                                                        List.of(
                                                                                                "COMPTABLE",
                                                                                                "SUPPORT"))))
                                                .authorities(new KeycloakRealmRoleConverter())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subject").value("user-123"))
                .andExpect(jsonPath("$.username").value("acomptable"))
                .andExpect(jsonPath("$.roles").isArray())
                .andExpect(jsonPath("$.roles[0]").value("COMPTABLE"))
                .andExpect(jsonPath("$.roles[1]").value("SUPPORT"));
    }

    @Test
    @DisplayName("Un rôle insuffisant sur une route protégée renvoie 403 au format Problem")
    void insufficientRoleIsForbidden() throws Exception {
        // Autorisation verticale : authentifié mais sans le rôle requis.
        mockMvc.perform(
                        get("/test/admin-only")
                                .with(
                                        jwt().jwt(builder -> builder.subject("u"))
                                                .authorities(List.of())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("Le bon rôle ouvre la route protégée")
    void sufficientRoleIsAllowed() throws Exception {
        mockMvc.perform(
                        get("/test/admin-only")
                                .with(
                                        jwt().jwt(
                                                        builder ->
                                                                builder.subject("admin")
                                                                        .claim(
                                                                                "realm_access",
                                                                                Map.of(
                                                                                        "roles",
                                                                                        List.of(
                                                                                                "ADMIN_SECURITE"))))
                                                .authorities(new KeycloakRealmRoleConverter())))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("La sonde de santé est accessible sans jeton")
    void healthEndpointIsPublic() throws Exception {
        // La propriété de sécurité vérifiée est l'accès public, pas l'état de santé :
        // sans broker RabbitMQ en test, la sonde peut répondre 503 (DOWN). Ce qui
        // compte est l'absence de 401/403 — l'auth ne bloque pas l'endpoint.
        int statusCode = mockMvc.perform(get("/actuator/health")).andReturn().getResponse().getStatus();
        org.assertj.core.api.Assertions.assertThat(statusCode).isNotIn(401, 403);
    }

    @Test
    @DisplayName("La réponse d'erreur ne pose pas de cookie de session")
    void errorResponseIsStateless() throws Exception {
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist(HttpHeaders.SET_COOKIE));
    }

    /** En-tête de corrélation du contrat, identique à CorrelationId.HEADER. */
    private static final class ProblemResponseWriterHeader {
        private static final String CORRELATION = "X-Correlation-Id";

        private ProblemResponseWriterHeader() {}
    }
}
