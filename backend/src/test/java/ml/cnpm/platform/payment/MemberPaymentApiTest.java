package ml.cnpm.platform.payment;

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
 * Espace membre — instructions de paiement, de bout en bout.
 *
 * <p>Deux propriétés sont défendues. Le PÉRIMÈTRE : un cotisant ne voit jamais la référence d'un
 * autre. La SOUVERAINETÉ : il ne voit que le diffusable — une référence VALIDÉE et un compte
 * d'encaissement ACTIF ; jamais une référence en attente ni un compte en brouillon.
 *
 * <p>Aucune donnée réelle : organisations, adhésions et coordonnées sont fictives.
 */
@SpringBootTest
@Testcontainers
class MemberPaymentApiTest {

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
    private static UUID betaAccount;
    private static UUID professionalAccount;
    private static final String ALPHA_REF = "CNPM-COT-2026-000ALP";
    private static final String BETA_REF = "CNPM-COT-2026-000BET";

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

        UUID alpha = seedMembership("Portail Alpha", "PORTAL-0001");
        UUID beta = seedMembership("Portail Beta", "PORTAL-0002");
        alphaAccount = seedMemberAccount("alpha@portal.test", alpha);
        betaAccount = seedMemberAccount("beta@portal.test", beta);
        professionalAccount =
                jdbcTemplate.queryForObject(
                        "INSERT INTO iam.user_account (email, display_name, account_type)"
                                + " VALUES ('agent@portal.test', 'Agent', 'PROFESSIONAL') RETURNING id",
                        UUID.class);

        // Référence VALIDÉE d'Alpha : diffusable, doit apparaître pour Alpha seulement.
        seedReference(alpha, 2026, ALPHA_REF, "VALIDATED");
        // Référence EN ATTENTE d'Alpha : non diffusable, ne doit jamais apparaître.
        seedReference(alpha, 2025, "CNPM-COT-2025-000PEN", "PENDING_VALIDATION");
        // Référence VALIDÉE de Beta : doit rester invisible à Alpha.
        seedReference(beta, 2026, BETA_REF, "VALIDATED");

        // Compte d'encaissement ACTIF : diffusable. Compte en BROUILLON : jamais présenté.
        seedCollectionAccount("ORANGE_MONEY", "Compte principal CNPM", "+22370000000", "ACTIVE");
        seedCollectionAccount("WAVE", "Compte brouillon", "+22371111111", "DRAFT");

        // Historique des encaissements : Alpha a un paiement CONFIRMÉ (reçu émis) et un paiement
        // RÉCEPTIONNÉ sans reçu. Beta a un paiement isolé qui ne doit jamais fuir vers Alpha.
        UUID alphaReferenceId = referenceId(ALPHA_REF);
        UUID betaReferenceId = referenceId(BETA_REF);
        UUID alphaConfirmed =
                seedTransaction(
                        alphaReferenceId,
                        "CNPM-PAY-ALP-0001",
                        "ORANGE_MONEY",
                        "150000.00",
                        "2026-07-24T10:00:00Z");
        seedTransaction(
                alphaReferenceId,
                "CNPM-PAY-ALP-0002",
                "WAVE",
                "50000.00",
                "2026-07-25T09:30:00Z");
        seedReceipt(alphaConfirmed, "CNPM-REC-ALP-0001");
        seedTransaction(
                betaReferenceId,
                "CNPM-PAY-BET-0001",
                "BANK_TRANSFER",
                "300000.00",
                "2026-07-23T08:00:00Z");
    }

    private UUID referenceId(String value) {
        return jdbcTemplate.queryForObject(
                "SELECT id FROM payment.payment_reference WHERE reference_value = ?",
                UUID.class,
                value);
    }

    private UUID seedTransaction(
            UUID referenceId, String number, String channel, String amount, String paidAt) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO payment.payment_transaction (payment_reference_id, transaction_number,"
                        + " channel, amount, paid_at, idempotency_key)"
                        + " VALUES (?, ?, ?, ?::numeric, ?::timestamptz, ?) RETURNING id",
                UUID.class,
                referenceId,
                number,
                channel,
                amount,
                paidAt,
                "idem-" + number);
    }

    private void seedReceipt(UUID transactionId, String receiptNumber) {
        jdbcTemplate.update(
                "INSERT INTO receipt.receipt (payment_transaction_id, receipt_number, issued_at,"
                        + " status, document_id, verification_token_hash, issued_by)"
                        + " VALUES (?, ?, now(), 'ISSUED', gen_random_uuid(), repeat('0', 64),"
                        + " ?)",
                transactionId,
                receiptNumber,
                professionalAccount);
    }

    private UUID seedMembership(String legalName, String number) {
        UUID organization =
                jdbcTemplate.queryForObject(
                        "INSERT INTO member.organization (legal_name, organization_type)"
                                + " VALUES (?, 'ENTREPRISE') RETURNING id",
                        UUID.class,
                        legalName);
        return jdbcTemplate.queryForObject(
                "INSERT INTO member.membership (organization_id, membership_number, category_code)"
                        + " VALUES (?, ?, 'ACTIVE') RETURNING id",
                UUID.class,
                organization,
                number);
    }

    private UUID seedMemberAccount(String email, UUID membership) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO iam.user_account (email, display_name, account_type, member_id)"
                        + " VALUES (?, 'Membre de test', 'MEMBER', ?) RETURNING id",
                UUID.class,
                email,
                membership);
    }

    private void seedReference(UUID membership, int exercise, String value, String statusValue) {
        boolean validated = "VALIDATED".equals(statusValue);
        jdbcTemplate.update(
                "INSERT INTO payment.payment_reference (membership_id, exercise, reference_value,"
                        + " status, approved_by, approved_at)"
                        + " VALUES (?, ?, ?, ?, ?, ?)",
                membership,
                exercise,
                value,
                statusValue,
                validated ? professionalAccount : null,
                validated ? java.time.OffsetDateTime.now() : null);
    }

    private void seedCollectionAccount(
            String channel, String label, String identifier, String statusValue) {
        boolean active = !"DRAFT".equals(statusValue);
        jdbcTemplate.update(
                "INSERT INTO payment.collection_account (channel, label, account_holder,"
                        + " account_identifier, status, approved_by, approved_at)"
                        + " VALUES (?, ?, 'CNPM', ?, ?, ?, ?)",
                channel,
                label,
                identifier,
                statusValue,
                active ? professionalAccount : null,
                active ? java.time.OffsetDateTime.now() : null);
    }

    private static RequestPostProcessor asMember(UUID accountId) {
        return jwt().jwt(builder -> builder.subject(accountId.toString()))
                .authorities(new SimpleGrantedAuthority("PERM_PAYMENT.READ"));
    }

    @Test
    @DisplayName("ne présente au cotisant que sa référence validée et les comptes actifs")
    void showsOnlyDiffusableToTheMember() throws Exception {
        mockMvc
                .perform(get("/portal/payment-instructions").with(asMember(alphaAccount)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.references", hasSize(1)))
                .andExpect(jsonPath("$.references[0].referenceValue").value(ALPHA_REF))
                .andExpect(jsonPath("$.collectionAccounts", hasSize(1)))
                .andExpect(jsonPath("$.collectionAccounts[0].channel").value("ORANGE_MONEY"))
                .andExpect(jsonPath("$.collectionAccounts[0].accountIdentifier").value("+22370000000"));
    }

    @Test
    @DisplayName("ne fait jamais fuir la référence d’un autre cotisant")
    void neverLeaksAnotherMembersReference() throws Exception {
        mockMvc
                .perform(get("/portal/payment-instructions").with(asMember(betaAccount)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.references[*].referenceValue", containsInAnyOrder(BETA_REF)));
    }

    @Test
    @DisplayName("refuse un compte sans adhésion (compte professionnel)")
    void refusesAccountWithoutMembership() throws Exception {
        mockMvc
                .perform(get("/portal/payment-instructions").with(asMember(professionalAccount)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("restitue l’historique du cotisant avec l’état de confirmation par le reçu")
    void showsOwnPaymentHistoryWithConfirmationState() throws Exception {
        mockMvc
                .perform(get("/portal/payments").with(asMember(alphaAccount)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.payments", hasSize(2)))
                // Le plus récent d'abord (paid_at décroissant) : ALP-0002, non confirmé.
                .andExpect(jsonPath("$.payments[0].transactionNumber").value("CNPM-PAY-ALP-0002"))
                .andExpect(jsonPath("$.payments[0].confirmed").value(false))
                .andExpect(jsonPath("$.payments[0].receiptNumber").doesNotExist())
                // Le paiement confirmé porte son numéro de reçu officiel.
                .andExpect(jsonPath("$.payments[1].transactionNumber").value("CNPM-PAY-ALP-0001"))
                .andExpect(jsonPath("$.payments[1].confirmed").value(true))
                .andExpect(jsonPath("$.payments[1].receiptNumber").value("CNPM-REC-ALP-0001"))
                .andExpect(jsonPath("$.payments[1].referenceValue").value(ALPHA_REF));
    }

    @Test
    @DisplayName("ne fait jamais fuir le paiement d’un autre cotisant")
    void neverLeaksAnotherMembersPayment() throws Exception {
        mockMvc
                .perform(get("/portal/payments").with(asMember(alphaAccount)))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath(
                                "$.payments[*].transactionNumber",
                                containsInAnyOrder("CNPM-PAY-ALP-0002", "CNPM-PAY-ALP-0001")));
    }

    @Test
    @DisplayName("refuse l’historique d’un compte sans adhésion")
    void refusesPaymentHistoryForAccountWithoutMembership() throws Exception {
        mockMvc
                .perform(get("/portal/payments").with(asMember(professionalAccount)))
                .andExpect(status().isNotFound());
    }
}
