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
 * Espace membre — annuaire des organisations membres, de bout en bout.
 *
 * <p>Deux propriétés sont défendues. La SÉLECTION : seules les organisations à adhésion ACTIVE
 * figurent à l'annuaire. La NON-DIVULGATION : la projection reste institutionnelle (nom, secteur,
 * catégorie, ancienneté), sans contact ni donnée sensible. Aucune donnée réelle.
 */
@SpringBootTest
@Testcontainers
class MemberDirectoryApiTest {

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
    private static UUID memberAccount;

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

        // Deux organisations à adhésion ACTIVE : visibles. Une à adhésion PENDING : masquée.
        UUID visibleA = seedOrganization("Annuaire Sahel Agro", "AGRI");
        seedMembership(visibleA, "DIR-A1", "ACTIVE");
        UUID visibleB = seedOrganization("Annuaire Niger Services", "SERVICES");
        seedMembership(visibleB, "DIR-B1", "ACTIVE");
        UUID hidden = seedOrganization("Annuaire Prospect", "CRAFT");
        seedMembership(hidden, "DIR-C1", "PENDING");

        // Un compte membre quelconque pour appeler l'annuaire.
        UUID membership =
                jdbcTemplate.queryForObject(
                        "SELECT id FROM member.membership WHERE membership_number = 'DIR-A1'",
                        UUID.class);
        memberAccount =
                jdbcTemplate.queryForObject(
                        "INSERT INTO iam.user_account (email, display_name, account_type, member_id)"
                                + " VALUES ('dir-member@portal.test', 'Membre', 'MEMBER', ?)"
                                + " RETURNING id",
                        UUID.class,
                        membership);
    }

    private UUID seedOrganization(String legalName, String sector) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO member.organization (legal_name, organization_type, sector_code)"
                        + " VALUES (?, 'ENTREPRISE', ?) RETURNING id",
                UUID.class,
                legalName,
                sector);
    }

    private void seedMembership(UUID organization, String number, String status) {
        jdbcTemplate.update(
                "INSERT INTO member.membership (organization_id, membership_number, category_code,"
                        + " status, joined_at) VALUES (?, ?, 'ENTREPRISE', ?, DATE '2021-03-15')",
                organization,
                number,
                status);
    }

    private static RequestPostProcessor asMember() {
        return jwt().jwt(builder -> builder.subject(memberAccount.toString()))
                .authorities(new SimpleGrantedAuthority("PERM_CONTRIBUTION.READ"));
    }

    @Test
    @DisplayName("ne liste que les organisations à adhésion active, avec des attributs non sensibles")
    void listsOnlyActiveMemberOrganizations() throws Exception {
        mockMvc
                .perform(get("/portal/directory").with(asMember()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(
                        jsonPath(
                                "$.items[*].name",
                                containsInAnyOrder(
                                        "Annuaire Sahel Agro", "Annuaire Niger Services")))
                .andExpect(jsonPath("$.items[0].category").value("ENTREPRISE"));
    }

    @Test
    @DisplayName("filtre par nom d'organisation")
    void filtersByName() throws Exception {
        mockMvc
                .perform(get("/portal/directory").param("search", "Niger").with(asMember()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].name").value("Annuaire Niger Services"))
                .andExpect(jsonPath("$.items[0].sector").value("SERVICES"));
    }
}
