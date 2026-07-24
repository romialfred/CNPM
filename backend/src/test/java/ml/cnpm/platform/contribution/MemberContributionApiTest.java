package ml.cnpm.platform.contribution;

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
 * Espace membre — « mes cotisations », de bout en bout.
 *
 * <p>La propriété défendue ici est le PÉRIMÈTRE : deux adhésions coexistent dans la base du
 * test, et un membre ne doit jamais voir, compter ni deviner les appels de l'autre. Le cas
 * négatif compte autant que le nominal — un écran de portail qui fuit d'un membre à l'autre
 * est la panne la plus coûteuse de ce module.
 *
 * <p>Aucune donnée réelle : les organisations, adhésions et montants sont fictifs
 * ({@code .claude/rules/testing.md}).
 */
@SpringBootTest
@Testcontainers
class MemberContributionApiTest {

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

    /**
     * Le jeu d'essai est semé UNE FOIS pour la classe et jamais effacé : {@code
     * contribution.adjustment} est en ajout seul (V4/V5) et refuse toute suppression, ce qui
     * est exactement la protection attendue d'un journal financier. Les tests ne font que
     * lire, l'ordre d'exécution est donc sans effet.
     */
    private static boolean seeded;

    /** Compte du membre observé, et compte d'un membre concurrent. */
    private static UUID account;
    private static UUID otherAccount;
    private static UUID professionalAccount;
    /** Appel réglé du membre observé, et appel appartenant à l'autre membre. */
    private static UUID settledCall;
    private static UUID otherMemberCall;

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

        UUID membership = seedMembership("Portail Alpha", "PORTAL-0001");
        UUID otherMembership = seedMembership("Portail Beta", "PORTAL-0002");
        account = seedMemberAccount("alpha@portal.test", membership);
        otherAccount = seedMemberAccount("beta@portal.test", otherMembership);
        professionalAccount =
                jdbcTemplate.queryForObject(
                        "INSERT INTO iam.user_account (email, display_name, account_type)"
                                + " VALUES ('agent@portal.test', 'Agent', 'PROFESSIONAL') RETURNING id",
                        UUID.class);

        UUID year2026 = seedFiscalYear(2026);
        UUID year2025 = seedFiscalYear(2025);

        // Appel partiellement réglé, échéance très lointaine pour que le test ne devienne pas
        // « en retard » avec le temps qui passe.
        seedCall(membership, year2026, "APP-2026-0001", "1250000.00", "1000000.00", "2999-03-31");
        // Appel entièrement réglé sur l'exercice précédent.
        settledCall =
                seedCall(membership, year2025, "APP-2025-0001", "800000.00", "0.00", "2025-03-31");
        // Appel d'un AUTRE membre : il ne doit apparaître nulle part pour le membre observé.
        otherMemberCall =
                seedCall(otherMembership, year2026, "APP-2026-9999", "500000.00", "500000.00",
                        "2999-06-30");

        jdbcTemplate.update(
                "INSERT INTO contribution.installment (contribution_call_id, installment_no,"
                        + " due_date, amount_due, amount_paid, status)"
                        + " VALUES (?, 1, DATE '2025-02-28', 800000.00, 800000.00, 'SETTLED')",
                settledCall);
        jdbcTemplate.update(
                "INSERT INTO contribution.adjustment (contribution_call_id, adjustment_number,"
                        + " adjustment_type, amount, reason_code)"
                        + " VALUES (?, 'AJU-2025-0001', 'CREDIT', 50000.00, 'REMISE_EXCEPTIONNELLE')",
                settledCall);
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

    private UUID seedFiscalYear(int year) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO contribution.fiscal_year (year, start_date, end_date)"
                        + " VALUES (?, make_date(?, 1, 1), make_date(?, 12, 31)) RETURNING id",
                UUID.class,
                year,
                year,
                year);
    }

    private UUID seedCall(
            UUID membership, UUID fiscalYear, String number, String due, String balance, String dueDate) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO contribution.contribution_call (membership_id, fiscal_year_id,"
                        + " call_number, amount_due, due_date, balance_amount)"
                        + " VALUES (?, ?, ?, ?::numeric, ?::date, ?::numeric) RETURNING id",
                UUID.class,
                membership,
                fiscalYear,
                number,
                due,
                dueDate,
                balance);
    }

    private static RequestPostProcessor asMember(UUID accountId) {
        return jwt().jwt(builder -> builder.subject(accountId.toString()))
                .authorities(new SimpleGrantedAuthority("PERM_CONTRIBUTION.READ"));
    }

    @Test
    @DisplayName("ne restitue que les appels de l’adhésion du compte connecté")
    void scopesToTheConnectedMembership() throws Exception {
        mockMvc.perform(get("/portal/contributions").with(asMember(account)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.items.length()").value(2))
                // L'appel de l'autre membre ne doit apparaître sous aucune référence.
                .andExpect(jsonPath("$.items[?(@.reference == 'APP-2026-9999')]").isEmpty())
                .andExpect(jsonPath("$.availableExercises").value(org.hamcrest.Matchers.contains(2026, 2025)));
    }

    @Test
    @DisplayName("dérive l’état d’affichage depuis le solde et l’échéance")
    void derivesTheDisplayStatus() throws Exception {
        mockMvc.perform(get("/portal/contributions").param("sort", "reference").with(asMember(account)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].reference").value("APP-2025-0001"))
                .andExpect(jsonPath("$.items[0].status").value("REGLEE"))
                .andExpect(jsonPath("$.items[0].outstandingAmount").value("0.00"))
                .andExpect(jsonPath("$.items[1].reference").value("APP-2026-0001"))
                // Solde entamé, échéance encore à venir : partielle, pas en retard.
                .andExpect(jsonPath("$.items[1].status").value("PARTIELLE"))
                .andExpect(jsonPath("$.items[1].paidAmount").value("250000.00"));
    }

    @Test
    @DisplayName("filtre par état et par exercice")
    void filtersByStatusAndExercise() throws Exception {
        mockMvc.perform(
                        get("/portal/contributions").param("status", "REGLEE").with(asMember(account)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].reference").value("APP-2025-0001"));

        mockMvc.perform(
                        get("/portal/contributions").param("exercise", "2026").with(asMember(account)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].exercise").value(2026));
    }

    @Test
    @DisplayName("pagine sans recouvrement ni perte de ligne")
    void paginatesWithAStableOrder() throws Exception {
        mockMvc.perform(
                        get("/portal/contributions")
                                .param("sort", "reference")
                                .param("page", "0")
                                .param("size", "1")
                                .with(asMember(account)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.items[0].reference").value("APP-2025-0001"));

        mockMvc.perform(
                        get("/portal/contributions")
                                .param("sort", "reference")
                                .param("page", "1")
                                .param("size", "1")
                                .with(asMember(account)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].reference").value("APP-2026-0001"));
    }

    @Test
    @DisplayName("restitue l’échéancier et les ajustements du détail")
    void returnsScheduleAndAdjustments() throws Exception {
        mockMvc.perform(get("/portal/contributions/" + settledCall).with(asMember(account)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reference").value("APP-2025-0001"))
                .andExpect(jsonPath("$.schedule.length()").value(1))
                .andExpect(jsonPath("$.schedule[0].label").value("Échéance 1"))
                .andExpect(jsonPath("$.schedule[0].outstandingAmount").value("0.00"))
                .andExpect(jsonPath("$.adjustments.length()").value(1))
                .andExpect(jsonPath("$.adjustments[0].direction").value("CREDIT"))
                .andExpect(jsonPath("$.adjustments[0].reference").value("AJU-2025-0001"));
    }

    @Test
    @DisplayName("répond 404 sur l’appel d’un autre membre, comme sur un appel inexistant")
    void hidesAnotherMembersContribution() throws Exception {
        mockMvc.perform(get("/portal/contributions/" + otherMemberCall).with(asMember(account)))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/portal/contributions/" + UUID.randomUUID()).with(asMember(account)))
                .andExpect(status().isNotFound());

        // Contrôle du contrôle : le même appel est bien visible par son propre titulaire,
        // sans quoi le test passerait pour une raison sans rapport avec le périmètre.
        mockMvc.perform(get("/portal/contributions/" + otherMemberCall).with(asMember(otherAccount)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reference").value("APP-2026-9999"));
    }

    @Test
    @DisplayName("refuse un compte sans adhésion rattachée, même habilité")
    void refusesAnAccountWithoutMembership() throws Exception {
        // Une page vide laisserait croire à une adhésion sans cotisation : on répond 404.
        mockMvc.perform(get("/portal/contributions").with(asMember(professionalAccount)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("refuse une entrée hors du vocabulaire du contrat")
    void rejectsInputOutsideTheContract() throws Exception {
        mockMvc.perform(
                        get("/portal/contributions").param("status", "INEXISTANT").with(asMember(account)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(
                        get("/portal/contributions").param("size", "500").with(asMember(account)))
                .andExpect(status().isBadRequest());

        // Un tri libre serait une porte ouverte sur l'ordre du SQL : il est refusé au bord.
        mockMvc.perform(
                        get("/portal/contributions").param("sort", "amount_due").with(asMember(account)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("refuse un compte sans permission de lecture des cotisations")
    void deniesAnAccountWithoutContributionRead() throws Exception {
        mockMvc.perform(
                        get("/portal/contributions")
                                .with(
                                        jwt().jwt(builder -> builder.subject(account.toString()))
                                                .authorities(new SimpleGrantedAuthority("PERM_IAM.USER.READ"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("refuse l’anonyme")
    void rejectsAnonymousAccess() throws Exception {
        mockMvc.perform(get("/portal/contributions")).andExpect(status().isUnauthorized());
    }
}
