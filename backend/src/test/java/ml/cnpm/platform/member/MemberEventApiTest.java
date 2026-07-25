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
 * Espace membre — actualités et informations (événements CNPM), de bout en bout.
 *
 * <p>La SOUVERAINETÉ est défendue : seuls les événements publiés figurent au fil ; un brouillon
 * ou un événement annulé ne franchit jamais la frontière du membre. Aucune donnée réelle.
 */
@SpringBootTest
@Testcontainers
class MemberEventApiTest {

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

        seedEvent("EVT-PUB-1", "Assemblée générale 2026", "ASSEMBLEE", "PUBLISHED", "2026-09-30T09:00:00Z");
        seedEvent("EVT-PUB-2", "Forum des adhérents", "FORUM", "SCHEDULED", "2026-10-15T09:00:00Z");
        seedEvent("EVT-DRAFT", "Atelier interne (brouillon)", "FORMATION", "DRAFT", "2026-11-01T09:00:00Z");
        seedEvent("EVT-CANCEL", "Séminaire annulé", "FORMATION", "CANCELLED", "2026-08-01T09:00:00Z");

        UUID organization =
                jdbcTemplate.queryForObject(
                        "INSERT INTO member.organization (legal_name, organization_type)"
                                + " VALUES ('Actualités Alpha', 'ENTREPRISE') RETURNING id",
                        UUID.class);
        UUID membership =
                jdbcTemplate.queryForObject(
                        "INSERT INTO member.membership (organization_id, membership_number,"
                                + " category_code) VALUES (?, 'EVT-0001', 'ENTREPRISE') RETURNING id",
                        UUID.class,
                        organization);
        memberAccount =
                jdbcTemplate.queryForObject(
                        "INSERT INTO iam.user_account (email, display_name, account_type, member_id)"
                                + " VALUES ('evt-member@portal.test', 'Membre', 'MEMBER', ?)"
                                + " RETURNING id",
                        UUID.class,
                        membership);
    }

    private void seedEvent(
            String code, String title, String type, String statusValue, String startAt) {
        jdbcTemplate.update(
                "INSERT INTO event.event (event_code, title, event_type, start_at, status)"
                        + " VALUES (?, ?, ?, ?::timestamptz, ?)",
                code,
                title,
                type,
                startAt,
                statusValue);
    }

    private static RequestPostProcessor asMember() {
        return jwt().jwt(builder -> builder.subject(memberAccount.toString()))
                .authorities(new SimpleGrantedAuthority("PERM_CONTRIBUTION.READ"));
    }

    @Test
    @DisplayName("ne publie que les événements publiés, jamais un brouillon ni un annulé")
    void listsOnlyPublishedEvents() throws Exception {
        mockMvc
                .perform(get("/portal/events").with(asMember()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(
                        jsonPath(
                                "$.items[*].title",
                                containsInAnyOrder(
                                        "Assemblée générale 2026", "Forum des adhérents")))
                // Le plus récent d'abord (start_at décroissant).
                .andExpect(jsonPath("$.items[0].title").value("Forum des adhérents"));
    }
}
