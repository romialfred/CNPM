package ml.cnpm.platform.recovery;

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

/** Preuve API/PostgreSQL de la consultation des campagnes, sans creation ni lancement. */
@SpringBootTest
@Testcontainers
class CollectionCampaignApiTest {

    @Container
    @SuppressWarnings("resource")
    private static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer(DockerImageName.parse("postgres:18.4"));

    private static final UUID CAMPAIGN_ONE =
            UUID.fromString("30000000-0000-4000-8000-000000000001");

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
        jdbcTemplate.update("DELETE FROM recovery.campaign WHERE campaign_code LIKE 'DEMO-%'");
        jdbcTemplate.update(
                """
                INSERT INTO recovery.campaign
                    (id, campaign_code, name, target_segment, start_at, end_at, status)
                VALUES (?, 'DEMO-REL-2026-02', 'Relance portefeuille de demonstration',
                        '{"membershipStatus":"DORMANT","regionCode":null}'::jsonb,
                        TIMESTAMPTZ '2026-09-01 08:00:00+00', NULL, 'DRAFT')
                """,
                CAMPAIGN_ONE);
        jdbcTemplate.update(
                """
                INSERT INTO recovery.campaign
                    (id, campaign_code, name, target_segment, start_at, end_at, status)
                VALUES (?, 'DEMO-REL-2026-01', 'Relance echeances de demonstration',
                        '{"membershipStatus":"ACTIVE"}'::jsonb,
                        TIMESTAMPTZ '2026-08-01 08:00:00+00',
                        TIMESTAMPTZ '2026-08-31 18:00:00+00', 'DRAFT')
                """,
                UUID.fromString("30000000-0000-4000-8000-000000000002"));
    }

    @Test
    void listsCampaignsWithoutCreatingOrLaunchingThem() throws Exception {
        mockMvc.perform(
                        get("/collection-campaigns?page=0&size=1")
                                .with(jwt().authorities(recoveryRead())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(CAMPAIGN_ONE.toString()))
                .andExpect(jsonPath("$.items[0].businessReference")
                        .value("DEMO-REL-2026-02"))
                .andExpect(jsonPath("$.items[0].status").value("DRAFT"))
                .andExpect(jsonPath("$.items[0].attributes.name")
                        .value("Relance portefeuille de demonstration"))
                .andExpect(jsonPath("$.items[0].attributes.targetSegment.membershipStatus")
                        .value("DORMANT"))
                .andExpect(jsonPath("$.items[0].attributes.targetSegment.regionCode")
                        .value(nullValue()))
                .andExpect(jsonPath("$.items[0].attributes.startAt")
                        .value("2026-09-01T08:00:00Z"))
                .andExpect(jsonPath("$.items[0].attributes.endAt").doesNotExist())
                .andExpect(jsonPath("$.items[0].audit.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.items[0].audit.updatedAt").isNotEmpty())
                .andExpect(jsonPath("$.items[0].audit.version").value(0))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2));

        mockMvc.perform(
                        get("/collection-campaigns?page=1&size=1")
                                .with(jwt().authorities(recoveryRead())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].businessReference")
                        .value("DEMO-REL-2026-01"))
                .andExpect(jsonPath("$.items[0].attributes.endAt")
                        .value("2026-08-31T18:00:00Z"));
    }

    @Test
    void rejectsInvalidPagination() throws Exception {
        mockMvc.perform(
                        get("/collection-campaigns?page=-1&size=101")
                                .with(jwt().authorities(recoveryRead())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void requiresAuthenticationAndReadPermission() throws Exception {
        mockMvc.perform(get("/collection-campaigns")).andExpect(status().isUnauthorized());

        mockMvc.perform(
                        get("/collection-campaigns")
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority(
                                                        "PERM_RECOVERY.CAMPAIGN.WRITE"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    private static SimpleGrantedAuthority recoveryRead() {
        return new SimpleGrantedAuthority("PERM_RECOVERY.READ");
    }

    @TestConfiguration
    static class JwtDecoderStub {
        @Bean
        JwtDecoder jwtDecoder() {
            return token -> Jwt.withTokenValue(token).header("alg", "none").subject("test").build();
        }
    }
}
