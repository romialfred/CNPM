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
}
