package ml.cnpm.platform.contribution;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Assertions;
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
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Test de bout en bout de l'émission et de la consultation des appels de cotisation.
 *
 * <p>Le montant est saisi par l'agent (aucun barème n'est fixé par les sources) : le test
 * vérifie la mécanique — idempotence, conflit, solde, autorisation — pas un montant métier.
 * Montants en {@code numeric(19,2)}, jamais de flottant.
 */
@SpringBootTest
@Testcontainers
class ContributionCallApiTest {

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

    private static final String ORG_ID = "abcdabcd-0000-0000-0000-000000000001";
    private static final String MEMBERSHIP_ID = "abcdabcd-1111-0000-0000-000000000001";
    private static final String MEMBERSHIP_ID_2 = "abcdabcd-1111-0000-0000-000000000002";
    private static final String KEY = "idem-0000000000001";
    private static final String ACTOR = "77777777-6666-5555-4444-333333333333";

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
        jdbcTemplate.update(
                "INSERT INTO member.organization (id, legal_name, organization_type, status, risk_level) "
                        + "VALUES (?::uuid, 'Cotisante SA', 'PME', 'ACTIVE', 'NORMAL') "
                        + "ON CONFLICT (id) DO NOTHING",
                ORG_ID);
        insertMembership(MEMBERSHIP_ID, "CNPM-COT-0001");
        insertMembership(MEMBERSHIP_ID_2, "CNPM-COT-0002");
    }

    private void insertMembership(String id, String number) {
        jdbcTemplate.update(
                "INSERT INTO member.membership (id, organization_id, membership_number, category_code, status) "
                        + "VALUES (?::uuid, ?::uuid, ?, 'PME', 'ACTIVE') ON CONFLICT (id) DO NOTHING",
                id,
                ORG_ID,
                number);
    }

    private static RequestPostProcessor as(String authority) {
        return jwt().jwt(j -> j.subject(ACTOR)).authorities(new SimpleGrantedAuthority(authority));
    }

    private static String body(String callNumber, String membershipId, String amount) {
        return """
                { "callNumber": "%s", "membershipId": "%s", "fiscalYear": 2026,
                  "amountDue": %s, "dueDate": "2026-12-31" }
                """
                .formatted(callNumber, membershipId, amount);
    }

    private long count(String sql, Object... args) {
        return jdbcTemplate.queryForObject(sql, Long.class, args);
    }

    @Test
    void issuesACallWithTheAmountEnteredByTheAgent() throws Exception {
        mockMvc.perform(
                        post("/contribution-calls")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("APP-2026-0001", MEMBERSHIP_ID, "150000.00"))
                                .with(as("PERM_CONTRIBUTION.GENERATE")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.callNumber").value("APP-2026-0001"))
                .andExpect(jsonPath("$.amountDue").value(150000.00))
                // À l'émission, rien n'est encaissé : le reste dû égale le montant appelé.
                .andExpect(jsonPath("$.balanceAmount").value(150000.00))
                .andExpect(jsonPath("$.currency").value("XOF"))
                .andExpect(jsonPath("$.status").value("ISSUED"))
                .andExpect(jsonPath("$.fiscalYear").value(2026));

        // Le montant est stocké en numeric(19,2), pas en flottant.
        Assertions.assertEquals(
                "150000.00",
                jdbcTemplate.queryForObject(
                        "SELECT amount_due::text FROM contribution.contribution_call "
                                + "WHERE call_number = 'APP-2026-0001'",
                        String.class));
        // L'exercice est ouvert à la volée sur l'année civile.
        Assertions.assertEquals(
                1L,
                count(
                        "SELECT count(*) FROM contribution.fiscal_year WHERE year = 2026 "
                                + "AND start_date = DATE '2026-01-01' AND end_date = DATE '2026-12-31'"));
        Assertions.assertEquals(
                1L,
                count(
                        "SELECT count(*) FROM audit.audit_event a "
                                + "JOIN contribution.contribution_call c ON c.id = a.entity_id "
                                + "WHERE c.call_number = 'APP-2026-0001' "
                                + "AND a.action_code = 'CONTRIBUTION_CALL.ISSUED'"));
    }

    @Test
    void replaysAnIdenticalIssuanceIdempotently() throws Exception {
        mockMvc.perform(
                        post("/contribution-calls")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("APP-2026-0002", MEMBERSHIP_ID, "50000.00"))
                                .with(as("PERM_CONTRIBUTION.GENERATE")))
                .andExpect(status().isCreated());

        mockMvc.perform(
                        post("/contribution-calls")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("APP-2026-0002", MEMBERSHIP_ID, "50000.00"))
                                .with(as("PERM_CONTRIBUTION.GENERATE")))
                .andExpect(status().isOk());

        Assertions.assertEquals(
                1L,
                count(
                        "SELECT count(*) FROM contribution.contribution_call "
                                + "WHERE call_number = 'APP-2026-0002'"));
    }

    @Test
    void conflictsWhenTheCallNumberIsReusedWithADifferentAmount() throws Exception {
        mockMvc.perform(
                        post("/contribution-calls")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("APP-2026-0003", MEMBERSHIP_ID, "50000.00"))
                                .with(as("PERM_CONTRIBUTION.GENERATE")))
                .andExpect(status().isCreated());

        mockMvc.perform(
                        post("/contribution-calls")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("APP-2026-0003", MEMBERSHIP_ID, "99000.00"))
                                .with(as("PERM_CONTRIBUTION.GENERATE")))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("STATE_CONFLICT"));
    }

    @Test
    void listsTheCallsOfAMemberWithTheirOutstandingBalance() throws Exception {
        mockMvc.perform(
                        post("/contribution-calls")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("APP-2026-0010", MEMBERSHIP_ID_2, "100000.00"))
                                .with(as("PERM_CONTRIBUTION.GENERATE")))
                .andExpect(status().isCreated());
        mockMvc.perform(
                        post("/contribution-calls")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("APP-2026-0011", MEMBERSHIP_ID_2, "25000.50"))
                                .with(as("PERM_CONTRIBUTION.GENERATE")))
                .andExpect(status().isCreated());

        mockMvc.perform(
                        get("/contribution-calls")
                                .param("membershipId", MEMBERSHIP_ID_2)
                                .with(as("PERM_CONTRIBUTION.READ")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                // Somme exacte des soldes, en décimal.
                .andExpect(jsonPath("$.outstandingBalance").value(125000.50))
                .andExpect(jsonPath("$.currency").value("XOF"));
    }

    @Test
    void rejectsANegativeAmount() throws Exception {
        mockMvc.perform(
                        post("/contribution-calls")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("APP-2026-0020", MEMBERSHIP_ID, "-1.00"))
                                .with(as("PERM_CONTRIBUTION.GENERATE")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void deniesIssuanceToAReadOnlyProfile() throws Exception {
        // Consulter n'est pas générer : CONTRIBUTION.GENERATE est une permission sensible.
        mockMvc.perform(
                        post("/contribution-calls")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("APP-2026-0030", MEMBERSHIP_ID, "1000.00"))
                                .with(as("PERM_CONTRIBUTION.READ")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void deniesConsultationWithoutTheReadPermission() throws Exception {
        mockMvc.perform(
                        get("/contribution-calls")
                                .param("membershipId", MEMBERSHIP_ID)
                                .with(as("PERM_MEMBER.READ")))
                .andExpect(status().isForbidden());
    }

    @Test
    void rejectsAnonymousAccess() throws Exception {
        mockMvc.perform(get("/contribution-calls").param("membershipId", MEMBERSHIP_ID))
                .andExpect(status().isUnauthorized());
    }

    @TestConfiguration
    static class JwtDecoderStub {
        @Bean
        JwtDecoder jwtDecoder() {
            return token -> Jwt.withTokenValue(token).header("alg", "none").subject("test").build();
        }
    }
}
