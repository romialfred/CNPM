package ml.cnpm.platform.administration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.http.MediaType;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Test de bout en bout du module ADM (l'« étalon »).
 *
 * <p>Il valide la chaîne complète sur un domaine sans enjeu financier : base migrée par
 * Flyway et donnée semée par {@code V3} → JPA → service porteur du {@code @PreAuthorize}
 * → contrôleur → JSON typé du contrat. Si un maillon casse, il casse ici, à bas coût.
 *
 * <p>Trois cas de sécurité sont couverts : accès autorisé (200), rôle insuffisant (403,
 * le test négatif exigé par ADR-008 et {@code .claude/rules/testing.md}) et absence de
 * jeton (401). MockMvc est câblé manuellement : sous Spring Boot 4, l'annotation
 * {@code @AutoConfigureMockMvc} ne fait plus partie de {@code spring-boot-starter-test}.
 */
@SpringBootTest
@Testcontainers
class ReferenceValueApiTest {

    @Container
    @SuppressWarnings("resource")
    private static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer(DockerImageName.parse("postgres:18.4"));

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        // Le broker n'est pas requis pour ce test : des identifiants fictifs font
        // résoudre la configuration, et la sonde de santé RabbitMQ est désactivée pour
        // ne pas tenter — et journaliser en erreur — une connexion vers un broker absent.
        registry.add("spring.rabbitmq.username", () -> "test");
        registry.add("spring.rabbitmq.password", () -> "test");
        registry.add("management.health.rabbit.enabled", () -> "false");
    }

    @Autowired private WebApplicationContext context;
    @Autowired private ml.cnpm.platform.shared.api.CorrelationIdFilter correlationIdFilter;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        // Le filtre de corrélation est enregistré automatiquement par Boot dans
        // l'application réelle ; MockMvc ne connaît pas ces filtres de conteneur, on
        // l'ajoute donc explicitement pour éprouver le même comportement.
        this.mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(correlationIdFilter)
                        .apply(springSecurity())
                        .build();
    }

    private static RequestPostProcessor asFunctionalAdmin() {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN_FONCTIONNEL"));
    }

    @Test
    void listsSeededReferenceValuesForAuthorizedRole() throws Exception {
        mockMvc.perform(get("/reference-values").with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.totalElements").isNumber())
                .andExpect(jsonPath("$.items[0].domain").isString())
                .andExpect(jsonPath("$.items[0].code").isString());
    }

    @Test
    void filtersByDomainAndReturnsTheSeededContent() throws Exception {
        // MEMBER_CATEGORY est semé par V3 avec quatre valeurs, ordonnées par sort_order :
        // ACTIVE(1), DORMANT(2), PROSPECT(3), MAJOR_CONTRIBUTOR(4).
        mockMvc.perform(
                        get("/reference-values")
                                .param("domain", "MEMBER_CATEGORY")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.items.length()").value(4))
                .andExpect(jsonPath("$.items[0].code").value("ACTIVE"))
                .andExpect(jsonPath("$.items[0].label").value("Active"))
                .andExpect(jsonPath("$.items[0].sortOrder").value(1))
                .andExpect(jsonPath("$.items[0].active").value(true))
                .andExpect(jsonPath("$.items[3].code").value("MAJOR_CONTRIBUTOR"));
    }

    @Test
    void paginatesWithAStableOrder() throws Exception {
        // Page 0 puis page 1 de taille 2 doivent découper la même liste ordonnée, sans
        // recouvrement — c'est ce qui distingue une vraie pagination d'un simple filtre.
        mockMvc.perform(
                        get("/reference-values")
                                .param("domain", "MEMBER_CATEGORY")
                                .param("page", "0")
                                .param("size", "2")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].code").value("ACTIVE"))
                .andExpect(jsonPath("$.items[1].code").value("DORMANT"));

        mockMvc.perform(
                        get("/reference-values")
                                .param("domain", "MEMBER_CATEGORY")
                                .param("page", "1")
                                .param("size", "2")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.items[0].code").value("PROSPECT"))
                .andExpect(jsonPath("$.items[1].code").value("MAJOR_CONTRIBUTOR"));
    }

    @Test
    void returnsAnEmptyPageForAnUnknownDomain() throws Exception {
        mockMvc.perform(
                        get("/reference-values")
                                .param("domain", "DOMAINE_INEXISTANT")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void echoesTheCorrelationHeaderOnSuccess() throws Exception {
        // Le contrat rend correlationId obligatoire en sortie ; l'en-tête doit reprendre
        // celui fourni par le client.
        String provided = "11111111-1111-1111-1111-111111111111";
        mockMvc.perform(
                        get("/reference-values")
                                .header("X-Correlation-Id", provided)
                                .with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Correlation-Id", provided));
    }

    @Test
    void rendersAPageSizeViolationAsAProblem() throws Exception {
        // Une entrée invalide produit un 400 au format Problem du contrat — code et
        // correlationId présents, type application/problem+json — et non le corps par
        // défaut de Spring.
        mockMvc.perform(get("/reference-values").param("size", "500").with(asFunctionalAdmin()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.correlationId").exists());
    }

    @Test
    void rejectsNegativeLowerBounds() throws Exception {
        mockMvc.perform(get("/reference-values").param("page", "-1").with(asFunctionalAdmin()))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/reference-values").param("size", "0").with(asFunctionalAdmin()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deniesAccessToRoleWithoutReferentialPermission() throws Exception {
        // Rôle authentifié mais dépourvu d'ADMIN.REFERENTIAL.READ : 403, jamais 200.
        mockMvc.perform(
                        get("/reference-values")
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("ROLE_MEMBRE_UTILISATEUR"))))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.correlationId").exists());
    }

    @Test
    void rejectsAnonymousAccess() throws Exception {
        mockMvc.perform(get("/reference-values"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
    }

    /** Décodeur factice : évite toute récupération réseau des métadonnées OIDC au démarrage. */
    @TestConfiguration
    static class JwtDecoderStub {
        @Bean
        JwtDecoder jwtDecoder() {
            return token -> Jwt.withTokenValue(token).header("alg", "none").subject("test").build();
        }
    }
}
