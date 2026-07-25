package ml.cnpm.platform.member;

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
 * Espace membre — tableau de bord, de bout en bout.
 *
 * <p>Deux propriétés sont défendues. Le PÉRIMÈTRE : un cotisant ne voit que la situation de SON
 * adhésion. L'EXACTITUDE : les totaux (appelé, réglé, reste dû, retard) sont dérivés des mêmes
 * lignes de cotisation que celles affichées, sans double comptage ni divergence.
 *
 * <p>Aucune donnée réelle : organisations, adhésions et montants sont fictifs.
 */
@SpringBootTest
@Testcontainers
class MemberDashboardApiTest {

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
    private static UUID alphaAccount;
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

        UUID alpha = seedMembership("Tableau Alpha", "DASH-0001", "ACTIVE");
        alphaAccount = seedMemberAccount("dash-alpha@portal.test", alpha);
        professionalAccount =
                jdbcTemplate.queryForObject(
                        "INSERT INTO iam.user_account (email, display_name, account_type)"
                                + " VALUES ('dash-agent@portal.test', 'Agent', 'PROFESSIONAL')"
                                + " RETURNING id",
                        UUID.class);

        UUID fy2025 = seedFiscalYear(2025);
        UUID fy2026 = seedFiscalYear(2026);
        // 2025 entièrement réglé : appelé 200000, solde 0.
        seedCall(alpha, fy2025, "APP-2025", "200000.00", "0.00", "2025-06-30");
        // 2026 partiellement réglé et EN RETARD : appelé 300000, solde 150000, échéance passée.
        seedCall(alpha, fy2026, "APP-2026", "300000.00", "150000.00", "2026-06-30");

        // Un règlement confirmé et son reçu, pour les compteurs.
        UUID reference =
                jdbcTemplate.queryForObject(
                        "INSERT INTO payment.payment_reference (membership_id, exercise,"
                                + " reference_value, status, approved_by, approved_at)"
                                + " VALUES (?, 2026, 'CNPM-COT-2026-000DSH', 'VALIDATED', ?, now())"
                                + " RETURNING id",
                        UUID.class,
                        alpha,
                        professionalAccount);
        UUID transaction =
                jdbcTemplate.queryForObject(
                        "INSERT INTO payment.payment_transaction (payment_reference_id,"
                                + " transaction_number, channel, amount, paid_at, idempotency_key)"
                                + " VALUES (?, 'CNPM-PAY-DSH-0001', 'ORANGE_MONEY', 150000.00,"
                                + " '2026-07-24T10:00:00Z'::timestamptz, 'idem-dsh-1') RETURNING id",
                        UUID.class,
                        reference);
        jdbcTemplate.update(
                "INSERT INTO receipt.receipt (payment_transaction_id, receipt_number, issued_at,"
                        + " status, document_id, verification_token_hash, issued_by)"
                        + " VALUES (?, 'CNPM-REC-DSH-0001', now(), 'ISSUED', gen_random_uuid(),"
                        + " repeat(md5('dsh'), 2), ?)",
                transaction,
                professionalAccount);
    }

    private UUID seedMembership(String legalName, String number, String status) {
        UUID organization =
                jdbcTemplate.queryForObject(
                        "INSERT INTO member.organization (legal_name, organization_type)"
                                + " VALUES (?, 'ENTREPRISE') RETURNING id",
                        UUID.class,
                        legalName);
        return jdbcTemplate.queryForObject(
                "INSERT INTO member.membership (organization_id, membership_number, category_code,"
                        + " status, joined_at) VALUES (?, ?, 'ENTREPRISE', ?, DATE '2021-03-15')"
                        + " RETURNING id",
                UUID.class,
                organization,
                number,
                status);
    }

    private UUID seedMemberAccount(String email, UUID membership) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO iam.user_account (email, display_name, account_type, member_id)"
                        + " VALUES (?, 'Membre de test', 'MEMBER', ?) RETURNING id",
                UUID.class,
                email,
                membership);
    }

    private UUID seedFiscalYear(int year) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO contribution.fiscal_year (year, start_date, end_date)"
                        + " VALUES (?, make_date(?, 1, 1), make_date(?, 12, 31)) RETURNING id",
                UUID.class,
                year,
                year,
                year);
    }

    private void seedCall(
            UUID membership,
            UUID fiscalYear,
            String number,
            String amountDue,
            String balance,
            String dueDate) {
        jdbcTemplate.update(
                "INSERT INTO contribution.contribution_call (membership_id, fiscal_year_id,"
                        + " call_number, amount_due, balance_amount, due_date)"
                        + " VALUES (?, ?, ?, ?::numeric, ?::numeric, ?::date)",
                membership,
                fiscalYear,
                number,
                amountDue,
                balance,
                dueDate);
    }

    private static RequestPostProcessor asMember(UUID accountId) {
        return jwt().jwt(builder -> builder.subject(accountId.toString()))
                .authorities(new SimpleGrantedAuthority("PERM_CONTRIBUTION.READ"));
    }

    @Test
    @DisplayName("agrège la situation réelle du cotisant, exercices et compteurs compris")
    void aggregatesTheMemberSituation() throws Exception {
        mockMvc
                .perform(get("/portal/dashboard").with(asMember(alphaAccount)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.identity.memberCode").value("DASH-0001"))
                .andExpect(jsonPath("$.identity.status").value("ACTIVE"))
                .andExpect(jsonPath("$.identity.memberSince").value("2021-03-15"))
                // Totaux : appelé 500000, réglé 350000, reste dû 150000, retard 150000.
                .andExpect(jsonPath("$.calledTotal").value(500000))
                .andExpect(jsonPath("$.settledTotal").value(350000))
                .andExpect(jsonPath("$.outstandingTotal").value(150000))
                .andExpect(jsonPath("$.overdueAmount").value(150000))
                .andExpect(jsonPath("$.paymentCount").value(1))
                .andExpect(jsonPath("$.receiptCount").value(1))
                .andExpect(jsonPath("$.lastPayment.amount").value(150000))
                // Exercices du plus récent au plus ancien.
                .andExpect(jsonPath("$.exercises", org.hamcrest.Matchers.hasSize(2)))
                .andExpect(jsonPath("$.exercises[0].year").value(2026))
                .andExpect(jsonPath("$.exercises[0].outstanding").value(150000))
                .andExpect(jsonPath("$.exercises[1].year").value(2025))
                .andExpect(jsonPath("$.exercises[1].outstanding").value(0));
    }

    @Test
    @DisplayName("refuse le tableau de bord d’un compte sans adhésion")
    void refusesDashboardForAccountWithoutMembership() throws Exception {
        mockMvc
                .perform(get("/portal/dashboard").with(asMember(professionalAccount)))
                .andExpect(status().isNotFound());
    }
}
