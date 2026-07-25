package ml.cnpm.platform.shared.security.profile;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
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
 * Espace membre — profil et photo, de bout en bout.
 *
 * <p>Vérifie qu'un membre lit son profil, change sa photo (type et taille contrôlés), la retire,
 * et qu'une image d'un mauvais format est refusée. Aucune donnée réelle.
 */
@SpringBootTest
@Testcontainers
class MemberProfileApiTest {

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

    @Autowired private WebApplicationContext context;
    @Autowired private ml.cnpm.platform.shared.api.CorrelationIdFilter correlationIdFilter;
    @Autowired private JdbcTemplate jdbcTemplate;

    private MockMvc mockMvc;
    private static boolean seeded;
    private static UUID account;

    // 1x1 PNG minimal, suffisant pour éprouver type et taille (le service ne décode pas l'image).
    private static final String PNG_BASE64 =
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    @BeforeEach
    void setUp() {
        this.mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(correlationIdFilter)
                        .apply(springSecurity())
                        .build();
        if (seeded) {
            return;
        }
        seeded = true;
        // Compte sans adhésion : la gestion du profil/photo est indépendante du type de compte
        // et évite ici de semer une organisation + adhésion (contrainte member_link).
        account =
                jdbcTemplate.queryForObject(
                        "INSERT INTO iam.user_account (email, display_name, account_type, organization,"
                                + " job_title) VALUES ('profil@portal.test', 'Membre Profil',"
                                + " 'PROFESSIONAL', 'Société de test', 'Gérant') RETURNING id",
                        UUID.class);
    }

    private static RequestPostProcessor asAccount(UUID accountId) {
        return jwt().jwt(builder -> builder.subject(accountId.toString()));
    }

    @Test
    @DisplayName("lit le profil du compte connecté, sans photo au départ")
    void readsProfile() throws Exception {
        mockMvc
                .perform(get("/portal/profile").with(asAccount(account)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Membre Profil"))
                .andExpect(jsonPath("$.organization").value("Société de test"))
                .andExpect(jsonPath("$.avatarDataUri").doesNotExist());
    }

    @Test
    @DisplayName("change la photo, la restitue en data-URI, puis la retire")
    void updatesAndRemovesAvatar() throws Exception {
        mockMvc
                .perform(
                        put("/portal/profile/avatar")
                                .with(asAccount(account))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"contentType\":\"image/png\",\"base64\":\"" + PNG_BASE64 + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarDataUri").value(org.hamcrest.Matchers.startsWith("data:image/png;base64,")));

        mockMvc
                .perform(delete("/portal/profile/avatar").with(asAccount(account)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarDataUri").doesNotExist());
    }

    @Test
    @DisplayName("refuse un format d'image non accepté")
    void refusesUnsupportedType() throws Exception {
        mockMvc
                .perform(
                        put("/portal/profile/avatar")
                                .with(asAccount(account))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"contentType\":\"image/gif\",\"base64\":\"" + PNG_BASE64 + "\"}"))
                .andExpect(status().isConflict());
    }
}
