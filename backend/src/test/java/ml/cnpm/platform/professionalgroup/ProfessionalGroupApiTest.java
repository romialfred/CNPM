package ml.cnpm.platform.professionalgroup;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
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

/** Preuve API/PostgreSQL du référentiel de groupements (GRP-001, lecture seule). */
@SpringBootTest
@Testcontainers
class ProfessionalGroupApiTest {

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

    @BeforeEach
    void setUp() {
        mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(correlationIdFilter)
                        .apply(springSecurity())
                        .build();
    }

    @Test
    void listsTheSeededGroupsWithTypedStablePagination() throws Exception {
        mockMvc.perform(
                        get("/professional-groups?page=0&size=5")
                                .with(
                                        jwt().authorities(
                                                        new SimpleGrantedAuthority("PERM_GROUP.READ"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(5))
                .andExpect(jsonPath("$.items[0].code").value("ACRCM"))
                .andExpect(jsonPath("$.items[0].name").isNotEmpty())
                .andExpect(jsonPath("$.items[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.items[0].version").value(0))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.totalElements").value(39))
                .andExpect(jsonPath("$.totalPages").value(8));

        mockMvc.perform(
                        get("/professional-groups?page=1&size=1")
                                .with(
                                        jwt().authorities(
                                                        new SimpleGrantedAuthority("PERM_GROUP.READ"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].code").value("AEPES"));
    }

    @Test
    void boundsThePageAtTheHttpBoundary() throws Exception {
        mockMvc.perform(
                        get("/professional-groups?page=-1&size=101")
                                .with(
                                        jwt().authorities(
                                                        new SimpleGrantedAuthority("PERM_GROUP.READ"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void getsASeededGroupByItsTechnicalIdentifier() throws Exception {
        UUID id =
                jdbcTemplate.queryForObject(
                        "SELECT id FROM member.professional_group WHERE code = 'ACRCM'",
                        UUID.class);

        mockMvc.perform(
                        get("/professional-groups/{id}", id)
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("PERM_GROUP.READ"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.code").value("ACRCM"))
                .andExpect(jsonPath("$.name").isNotEmpty())
                .andExpect(jsonPath("$.sectorCode").value(nullValue()))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.version").value(0));
    }

    @Test
    void returnsNormalizedErrorsForMalformedAndUnknownIdentifiers() throws Exception {
        mockMvc.perform(
                        get("/professional-groups/{id}", "not-a-uuid")
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("PERM_GROUP.READ"))))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        mockMvc.perform(
                        get(
                                        "/professional-groups/{id}",
                                        "00000000-0000-4000-8000-000000000000")
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("PERM_GROUP.READ"))))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    void protectsTheDirectoryWithTheDedicatedPermission() throws Exception {
        mockMvc.perform(get("/professional-groups")).andExpect(status().isUnauthorized());

        mockMvc.perform(
                        get(
                                "/professional-groups/{id}",
                                "00000000-0000-4000-8000-000000000000"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(
                        get("/professional-groups")
                                .with(
                                        jwt().authorities(
                                                        new SimpleGrantedAuthority("PERM_MEMBER.READ"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        mockMvc.perform(
                        get(
                                        "/professional-groups/{id}",
                                        "00000000-0000-4000-8000-000000000000")
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
