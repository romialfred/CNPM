package ml.cnpm.platform.member;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
 * Espace membre — utilisateurs de l'organisation, de bout en bout.
 *
 * <p>Le PÉRIMÈTRE est défendu : un cotisant ne voit que les comptes de SON organisation, jamais
 * ceux d'une autre. Aucune donnée réelle : organisations, comptes et rôles sont fictifs.
 */
@SpringBootTest
@Testcontainers
class MemberUserApiTest {

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
    private static UUID alphaAdminAccount;
    private static UUID professionalAccount;

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

        // Une organisation peut porter PLUSIEURS adhésions ; chaque compte membre est lié à une
        // adhésion distincte (member_id est unique). « Les utilisateurs de l'organisation » sont
        // donc les comptes de toutes les adhésions de cette organisation.
        UUID alpha = seedOrganization("Utilisateurs Alpha");
        UUID beta = seedOrganization("Utilisateurs Beta");

        alphaAdminAccount =
                seedMemberAccount("usr-alpha-admin@portal.test", "Awa Traoré", alpha, "USR-A1");
        seedMemberAccount("usr-alpha-user@portal.test", "Bakary Koné", alpha, "USR-A2");
        seedMemberAccount("usr-beta@portal.test", "Fanta Diallo", beta, "USR-B1");

        professionalAccount =
                jdbcTemplate.queryForObject(
                        "INSERT INTO iam.user_account (email, display_name, account_type)"
                                + " VALUES ('usr-agent@portal.test', 'Agent', 'PROFESSIONAL')"
                                + " RETURNING id",
                        UUID.class);

        // Un rôle membre pour l'admin d'Alpha : son libellé doit apparaître.
        UUID roleId =
                jdbcTemplate.queryForObject(
                        "SELECT id FROM iam.role WHERE code = 'MEMBRE_ADMIN'", UUID.class);
        jdbcTemplate.update(
                "INSERT INTO iam.user_role (user_id, role_id) VALUES (?, ?)",
                alphaAdminAccount,
                roleId);
    }

    private UUID seedOrganization(String legalName) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO member.organization (legal_name, organization_type)"
                        + " VALUES (?, 'ENTREPRISE') RETURNING id",
                UUID.class,
                legalName);
    }

    private UUID seedMemberAccount(
            String email, String displayName, UUID organization, String membershipNumber) {
        UUID membership =
                jdbcTemplate.queryForObject(
                        "INSERT INTO member.membership (organization_id, membership_number,"
                                + " category_code) VALUES (?, ?, 'ENTREPRISE') RETURNING id",
                        UUID.class,
                        organization,
                        membershipNumber);
        return jdbcTemplate.queryForObject(
                "INSERT INTO iam.user_account (email, display_name, account_type, member_id)"
                        + " VALUES (?, ?, 'MEMBER', ?) RETURNING id",
                UUID.class,
                email,
                displayName,
                membership);
    }

    private static RequestPostProcessor asMember(UUID accountId) {
        return jwt().jwt(builder -> builder.subject(accountId.toString()))
                .authorities(new SimpleGrantedAuthority("PERM_CONTRIBUTION.READ"));
    }

    @Test
    @DisplayName("liste les comptes de l'organisation avec leur rôle, sans fuir une autre")
    void listsOwnOrganizationUsers() throws Exception {
        mockMvc
                .perform(get("/portal/users").with(asMember(alphaAdminAccount)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(
                        jsonPath(
                                "$.items[*].displayName",
                                containsInAnyOrder("Awa Traoré", "Bakary Koné")))
                .andExpect(
                        jsonPath("$.items[?(@.displayName == 'Awa Traoré')].roleLabel")
                                .value(
                                        containsInAnyOrder(
                                                "Administrateur de l’entreprise membre")));
    }

    @Test
    @DisplayName("refuse la liste d'un compte sans adhésion")
    void refusesUsersForAccountWithoutMembership() throws Exception {
        mockMvc
                .perform(get("/portal/users").with(asMember(professionalAccount)))
                .andExpect(status().isNotFound());
    }
}
