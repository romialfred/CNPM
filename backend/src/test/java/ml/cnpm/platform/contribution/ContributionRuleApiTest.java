package ml.cnpm.platform.contribution;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
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

/** Preuve API/PostgreSQL de la consultation des baremes, sans publication. */
@SpringBootTest
@Testcontainers
class ContributionRuleApiTest {

    @Container
    @SuppressWarnings("resource")
    private static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer(DockerImageName.parse("postgres:18.4"));

    private static final UUID RULE_ONE =
            UUID.fromString("20000000-0000-4000-8000-000000000001");

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

    @BeforeEach
    void setUp() {
        mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(correlationIdFilter)
                        .apply(springSecurity())
                        .build();
        jdbcTemplate.update("DELETE FROM contribution.rate_rule WHERE rule_code LIKE 'DEMO-%'");
        jdbcTemplate.update(
                """
                INSERT INTO contribution.rate_rule
                    (id, rule_code, category_code, calculation_method, parameters,
                     valid_from, status)
                VALUES (?, 'DEMO-2026', 'DEMO_CATEGORY', 'FIXED',
                        '{"mode":"DEMO_NO_RATE","optional":null}'::jsonb,
                        DATE '2026-01-01', 'DRAFT')
                """,
                RULE_ONE);
        jdbcTemplate.update(
                """
                INSERT INTO contribution.rate_rule
                    (id, rule_code, category_code, calculation_method, parameters,
                     valid_from, valid_to, status)
                VALUES (?, 'DEMO-2025', 'DEMO_CATEGORY', 'FIXED', '{}'::jsonb,
                        DATE '2025-01-01', DATE '2025-12-31', 'ARCHIVED')
                """,
                UUID.fromString("20000000-0000-4000-8000-000000000002"));
    }

    @Test
    void listsVersionedRulesWithoutApplyingOrPublishingThem() throws Exception {
        mockMvc.perform(
                        get("/contribution-rules?page=0&size=1")
                                .with(jwt().authorities(contributionRead())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(RULE_ONE.toString()))
                .andExpect(jsonPath("$.items[0].businessReference").value("DEMO-2026"))
                .andExpect(jsonPath("$.items[0].status").value("DRAFT"))
                .andExpect(jsonPath("$.items[0].attributes.categoryCode")
                        .value("DEMO_CATEGORY"))
                .andExpect(jsonPath("$.items[0].attributes.calculationMethod").value("FIXED"))
                .andExpect(jsonPath("$.items[0].attributes.parameters.mode")
                        .value("DEMO_NO_RATE"))
                .andExpect(jsonPath("$.items[0].attributes.parameters.optional").value(nullValue()))
                .andExpect(jsonPath("$.items[0].attributes.validFrom").value("2026-01-01"))
                .andExpect(jsonPath("$.items[0].attributes.validTo").doesNotExist())
                .andExpect(jsonPath("$.items[0].audit.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.items[0].audit.updatedAt").isNotEmpty())
                .andExpect(jsonPath("$.items[0].audit.version").value(0))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2));

        mockMvc.perform(
                        get("/contribution-rules?page=1&size=1")
                                .with(jwt().authorities(contributionRead())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].businessReference").value("DEMO-2025"))
                .andExpect(jsonPath("$.items[0].attributes.validTo").value("2025-12-31"));
    }

    @Test
    void rejectsInvalidPagination() throws Exception {
        mockMvc.perform(
                        get("/contribution-rules?page=-1&size=101")
                                .with(jwt().authorities(contributionRead())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void requiresAuthenticationAndReadPermission() throws Exception {
        mockMvc.perform(get("/contribution-rules")).andExpect(status().isUnauthorized());

        mockMvc.perform(
                        get("/contribution-rules")
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority(
                                                        "PERM_CONTRIBUTION.RULE.WRITE"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    private static SimpleGrantedAuthority contributionRead() {
        return new SimpleGrantedAuthority("PERM_CONTRIBUTION.READ");
    }

    @TestConfiguration
    static class JwtDecoderStub {
        @Bean
        JwtDecoder jwtDecoder() {
            return token -> Jwt.withTokenValue(token).header("alg", "none").subject("test").build();
        }
    }
}
