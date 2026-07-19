package ml.cnpm.platform.audit;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/** Preuve de consultation habilitée du journal immuable (AUD-002, AUD-003 partiel). */
@SpringBootTest
@Testcontainers
class AuditEventApiTest {

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

    private static final String EVENT_ID = "10000000-0000-0000-0000-000000000001";
    private static final String ACTOR_ID = "20000000-0000-0000-0000-000000000001";
    private static final String ENTITY_ID = "30000000-0000-0000-0000-000000000001";
    private static final String CORRELATION_ID = "40000000-0000-0000-0000-000000000001";

    @Autowired private WebApplicationContext context;
    @Autowired private ml.cnpm.platform.shared.api.CorrelationIdFilter correlationIdFilter;
    @Autowired private JdbcTemplate jdbcTemplate;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(correlationIdFilter)
                        .apply(springSecurity())
                        .build();
        jdbcTemplate.update(
                "INSERT INTO audit.audit_event "
                        + "(id, created_at, actor_user_id, actor_type, action_code, entity_type, "
                        + "entity_id, before_hash, after_hash, correlation_id) "
                        + "VALUES (?::uuid, '2099-01-01T00:00:00Z', ?::uuid, 'USER', "
                        + "'TEST.SEARCH', 'test.entity', ?::uuid, ?, ?, ?::uuid) "
                        + "ON CONFLICT (id) DO NOTHING",
                EVENT_ID,
                ACTOR_ID,
                ENTITY_ID,
                "a".repeat(64),
                "b".repeat(64),
                CORRELATION_ID);
    }

    @Test
    void returnsAFilteredTypedPageWithoutSensitiveMetadata() throws Exception {
        mockMvc.perform(
                        get("/audit-events?page=0&size=10")
                                .with(
                                        jwt().authorities(
                                                        new SimpleGrantedAuthority("PERM_AUDIT.READ"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(EVENT_ID))
                .andExpect(jsonPath("$.items[0].actorUserId").value(ACTOR_ID))
                .andExpect(jsonPath("$.items[0].actionCode").value("TEST.SEARCH"))
                .andExpect(jsonPath("$.items[0].beforeHash").value("a".repeat(64)))
                .andExpect(jsonPath("$.items[0].afterHash").value("b".repeat(64)))
                .andExpect(jsonPath("$.items[0].correlationId").value(CORRELATION_ID))
                .andExpect(jsonPath("$.items[0].metadata").doesNotExist())
                .andExpect(jsonPath("$.items[0].ipAddress").doesNotExist())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void boundsAndProtectsAuditSearch() throws Exception {
        mockMvc.perform(
                        get("/audit-events?page=-1&size=101")
                                .with(
                                        jwt().authorities(
                                                        new SimpleGrantedAuthority("PERM_AUDIT.READ"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        mockMvc.perform(get("/audit-events")).andExpect(status().isUnauthorized());

        mockMvc.perform(
                        get("/audit-events")
                                .with(
                                        jwt().authorities(
                                                        new SimpleGrantedAuthority("PERM_MEMBER.READ"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @TestConfiguration
    static class JwtDecoderStub {
        @Bean
        JwtDecoder jwtDecoder() {
            return token -> Jwt.withTokenValue(token).header("alg", "none").subject("test").build();
        }
    }
}
