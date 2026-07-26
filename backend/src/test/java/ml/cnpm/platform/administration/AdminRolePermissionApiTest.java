package ml.cnpm.platform.administration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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
 * Octroi d'une permission à un rôle — de bout en bout ({@code POST
 * /admin/security/roles/{roleId}/permissions}).
 *
 * <p>Prouve la persistance réelle (INSERT/DELETE dans {@code iam.role_permission}) et
 * l'habilitation ({@code IAM.ROLE.ASSIGN}). Aucune donnée réelle.
 */
@SpringBootTest
@Testcontainers
class AdminRolePermissionApiTest {

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
        this.mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(correlationIdFilter)
                        .apply(springSecurity())
                        .build();
    }

    private static RequestPostProcessor asAssigner() {
        return jwt().authorities(new SimpleGrantedAuthority("PERM_IAM.ROLE.ASSIGN"));
    }

    private long grantCount(UUID roleId, UUID permissionId) {
        Long count =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM iam.role_permission WHERE role_id = ? AND permission_id = ?",
                        Long.class,
                        roleId,
                        permissionId);
        return count == null ? 0L : count;
    }

    @Test
    @DisplayName("accorde puis retire une permission à un rôle, avec persistance réelle")
    void grantsThenRevokesAPermission() throws Exception {
        // Le rôle AGENT_RECOUVREMENT existe après la refonte RBAC (V26) ; RECOVERY.READ est une
        // permission réelle du catalogue.
        UUID roleId =
                jdbcTemplate.queryForObject(
                        "SELECT id FROM iam.role WHERE code = 'AGENT_RECOUVREMENT'", UUID.class);
        UUID permissionId =
                jdbcTemplate.queryForObject(
                        "SELECT id FROM iam.permission WHERE code = 'RECOVERY.READ'", UUID.class);

        // Retrait (idempotent quel que soit l'état initial).
        mockMvc
                .perform(
                        post("/admin/security/roles/" + roleId + "/permissions")
                                .with(asAssigner())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"permissionId\":\"" + permissionId + "\",\"granted\":false}"))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertEquals(0L, grantCount(roleId, permissionId));

        // Octroi : la ligne de matrice renvoyée liste le rôle habilité.
        mockMvc
                .perform(
                        post("/admin/security/roles/" + roleId + "/permissions")
                                .with(asAssigner())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"permissionId\":\"" + permissionId + "\",\"granted\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("RECOVERY.READ"))
                .andExpect(jsonPath("$.grants[*].roleId", org.hamcrest.Matchers.hasItem(roleId.toString())));
        org.junit.jupiter.api.Assertions.assertEquals(1L, grantCount(roleId, permissionId));
    }

    @Test
    @DisplayName("refuse l'octroi sans l'habilitation IAM.ROLE.ASSIGN")
    void forbidsWithoutAuthority() throws Exception {
        UUID roleId =
                jdbcTemplate.queryForObject(
                        "SELECT id FROM iam.role WHERE code = 'AGENT_RECOUVREMENT'", UUID.class);
        UUID permissionId =
                jdbcTemplate.queryForObject(
                        "SELECT id FROM iam.permission WHERE code = 'RECOVERY.READ'", UUID.class);
        mockMvc
                .perform(
                        post("/admin/security/roles/" + roleId + "/permissions")
                                .with(jwt().authorities(new SimpleGrantedAuthority("PERM_IAM.USER.READ")))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"permissionId\":\"" + permissionId + "\",\"granted\":true}"))
                .andExpect(status().isForbidden());
    }
}
