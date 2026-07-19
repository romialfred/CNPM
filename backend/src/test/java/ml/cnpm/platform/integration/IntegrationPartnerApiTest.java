package ml.cnpm.platform.integration;

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

/** Preuve API/PostgreSQL en lecture seule de {@code listIntegrationPartners}. */
@SpringBootTest
@Testcontainers
class IntegrationPartnerApiTest {

    @Container
    @SuppressWarnings("resource")
    private static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer(DockerImageName.parse("postgres:18.4"));

    private static final UUID PARTNER_ONE =
            UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID PARTNER_TWO =
            UUID.fromString("10000000-0000-4000-8000-000000000002");

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
        jdbcTemplate.update(
                "DELETE FROM integration.partner WHERE partner_code LIKE 'DEMO-%'");
        jdbcTemplate.update(
                """
                INSERT INTO integration.partner
                    (id, partner_code, name, partner_type, status)
                VALUES (?, 'DEMO-BANK', 'Banque de demonstration', 'BANK', 'ACTIVE')
                """,
                PARTNER_ONE);
        jdbcTemplate.update(
                """
                INSERT INTO integration.partner
                    (id, partner_code, name, partner_type, status)
                VALUES (?, 'DEMO-SMS', 'Messagerie de demonstration', 'SMS', 'INACTIVE')
                """,
                PARTNER_TWO);
    }

    @Test
    void listsOnlyNonSensitivePartnerMetadataWithStablePagination() throws Exception {
        mockMvc.perform(
                        get("/integration-partners?page=0&size=1")
                                .with(jwt().authorities(monitorRead())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(PARTNER_ONE.toString()))
                .andExpect(jsonPath("$.items[0].businessReference").value("DEMO-BANK"))
                .andExpect(jsonPath("$.items[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.items[0].attributes.name")
                        .value("Banque de demonstration"))
                .andExpect(jsonPath("$.items[0].attributes.partnerType").value("BANK"))
                .andExpect(jsonPath("$.items[0].attributes.baseUrl").doesNotExist())
                .andExpect(jsonPath("$.items[0].attributes.secretReference").doesNotExist())
                .andExpect(jsonPath("$.items[0].audit.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.items[0].audit.updatedAt").isNotEmpty())
                .andExpect(jsonPath("$.items[0].audit.version").value(0))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(1))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2));

        mockMvc.perform(
                        get("/integration-partners?page=1&size=1")
                                .with(jwt().authorities(monitorRead())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].businessReference").value("DEMO-SMS"));
    }

    @Test
    void boundsPaginationAtTheHttpBoundary() throws Exception {
        mockMvc.perform(
                        get("/integration-partners?page=-1&size=101")
                                .with(jwt().authorities(monitorRead())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void requiresAuthenticationAndTheOperationsMonitoringPermission() throws Exception {
        mockMvc.perform(get("/integration-partners")).andExpect(status().isUnauthorized());

        mockMvc.perform(
                        get("/integration-partners")
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority(
                                                        "PERM_INTEGRATION.CONFIG.WRITE"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    private static SimpleGrantedAuthority monitorRead() {
        return new SimpleGrantedAuthority("PERM_OPS.MONITOR.READ");
    }

    @TestConfiguration
    static class JwtDecoderStub {
        @Bean
        JwtDecoder jwtDecoder() {
            return token -> Jwt.withTokenValue(token).header("alg", "none").subject("test").build();
        }
    }
}
