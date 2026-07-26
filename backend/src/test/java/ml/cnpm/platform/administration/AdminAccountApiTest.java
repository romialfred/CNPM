package ml.cnpm.platform.administration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
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
 * Chaîne complète des écritures sur les comptes : HTTP → autorisation → service →
 * PostgreSQL migré par Flyway → journal d'audit.
 *
 * <p>Les cas négatifs de sécurité sont ici de premier ordre ({@code .claude/rules/testing.md})
 * : une permission manquante donne 403 et jamais 200, l'anonyme donne 401, et la
 * réinitialisation d'un second facteur exige sa propre permission — pouvoir créer un
 * compte ne donne pas le droit d'effacer le second facteur d'un autre.
 */
@SpringBootTest
@Testcontainers
class AdminAccountApiTest {

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

    private static final String KEY = "idem-key-0123456789";

    @Autowired private WebApplicationContext context;
    @Autowired private ml.cnpm.platform.shared.api.CorrelationIdFilter correlationIdFilter;
    @Autowired private JdbcTemplate jdbcTemplate;

    private MockMvc mockMvc;
    private String roleId;

    @BeforeEach
    void setUp() {
        this.mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(correlationIdFilter)
                        .apply(springSecurity())
                        .build();
        // Rôle réellement semé par V3 : le test n'invente pas de référentiel.
        this.roleId =
                jdbcTemplate.queryForObject(
                        "SELECT id::text FROM iam.role WHERE code = 'ADMINISTRATEUR'", String.class);
    }

    /** Opérateur habilité à la vie des comptes : création (avec rôle) et changement d'état. */
    private static RequestPostProcessor asAccountAdmin() {
        return jwt().authorities(
                        new SimpleGrantedAuthority("PERM_IAM.USER.READ"),
                        new SimpleGrantedAuthority("PERM_IAM.USER.WRITE"),
                        new SimpleGrantedAuthority("PERM_IAM.ROLE.ASSIGN"));
    }

    /** Opérateur habilité en plus à réinitialiser un second facteur. */
    private static RequestPostProcessor asSecurityAdmin() {
        return jwt().authorities(
                        new SimpleGrantedAuthority("PERM_IAM.USER.READ"),
                        new SimpleGrantedAuthority("PERM_IAM.USER.WRITE"),
                        new SimpleGrantedAuthority("PERM_IAM.ROLE.ASSIGN"),
                        new SimpleGrantedAuthority("PERM_IAM.MFA.RESET"));
    }

    private String createBody(String email, String firstName) {
        return ("{\"accountType\":\"PROFESSIONAL\",\"firstName\":\"%s\",\"lastName\":\"Coulibaly\","
                        + "\"email\":\"%s\",\"jobTitle\":\"Chargée de recouvrement\",\"roleId\":\"%s\"}")
                .formatted(firstName, email, roleId);
    }

    private String create(String email) throws Exception {
        String body =
                mockMvc.perform(
                                post("/admin/security/accounts")
                                        .header("Idempotency-Key", KEY)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(createBody(email, "Aminata"))
                                        .with(asAccountAdmin()))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    @Test
    @DisplayName("crée un compte invité, sans second facteur, et l'audite")
    void createsAnInvitedAccount() throws Exception {
        String id = create("nouveau.compte@example.test");

        Integer audited =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM audit.audit_event WHERE entity_id = ?::uuid"
                                + " AND action_code = 'USER_ACCOUNT.CREATED' AND after_hash IS NOT NULL",
                        Integer.class,
                        id);
        Assertions.assertEquals(1, audited);

        // Aucun secret ne doit exister pour ce compte : ni mot de passe, ni secret TOTP.
        Integer secrets =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM iam.user_account WHERE id = ?::uuid"
                                + " AND (password_hash IS NOT NULL OR mfa_secret_encrypted IS NOT NULL)",
                        Integer.class,
                        id);
        Assertions.assertEquals(0, secrets);
    }

    @Test
    @DisplayName("rejoue une création identique sans doublon ni seconde trace")
    void replaysAnIdenticalCreation() throws Exception {
        String payload = createBody("rejeu@example.test", "Aminata");
        mockMvc.perform(
                        post("/admin/security/accounts")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload)
                                .with(asAccountAdmin()))
                .andExpect(status().isCreated());

        mockMvc.perform(
                        post("/admin/security/accounts")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload)
                                .with(asAccountAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("rejeu@example.test"));

        Integer rows =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM iam.user_account WHERE email = 'rejeu@example.test'",
                        Integer.class);
        Assertions.assertEquals(1, rows);
    }

    @Test
    @DisplayName("refuse une adresse déjà prise par un compte différent")
    void rejectsADivergentDuplicate() throws Exception {
        mockMvc.perform(
                        post("/admin/security/accounts")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(createBody("conflit@example.test", "Aminata"))
                                .with(asAccountAdmin()))
                .andExpect(status().isCreated());

        mockMvc.perform(
                        post("/admin/security/accounts")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(createBody("conflit@example.test", "Boubacar"))
                                .with(asAccountAdmin()))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    @DisplayName("suspend puis réactive un compte, et le tableau de bord le reflète")
    void suspendsAndReactivates() throws Exception {
        String id = create("suspension@example.test");

        mockMvc.perform(
                        post("/admin/security/accounts/" + id + "/status")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"status\":\"SUSPENDED\",\"reason\":\"Départ de l'organisation\"}")
                                .with(asAccountAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));

        // La suspension prime sur l'invitation : le compte n'a jamais ouvert de session et
        // doit malgré tout apparaître suspendu dans l'instantané.
        mockMvc.perform(get("/admin/security/snapshot").with(asAccountAdmin()))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.accounts[?(@.email == 'suspension@example.test')].status")
                                .value("SUSPENDED"));

        mockMvc.perform(
                        post("/admin/security/accounts/" + id + "/status")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"status\":\"ACTIVE\",\"reason\":\"Retour de mission\"}")
                                .with(asAccountAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INVITED"));

        Integer audited =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM audit.audit_event WHERE entity_id = ?::uuid"
                                + " AND action_code IN ('USER_ACCOUNT.SUSPENDED', 'USER_ACCOUNT.REACTIVATED')",
                        Integer.class,
                        id);
        Assertions.assertEquals(2, audited);
    }

    @Test
    @DisplayName("exige un motif pour suspendre")
    void requiresAReason() throws Exception {
        String id = create("motif@example.test");

        mockMvc.perform(
                        post("/admin/security/accounts/" + id + "/status")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"status\":\"SUSPENDED\"}")
                                .with(asAccountAdmin()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("réinitialise un second facteur, et seulement avec la permission dédiée")
    void resetsTheSecondFactorOnlyWithItsOwnPermission() throws Exception {
        String id = create("second.facteur@example.test");

        // Pouvoir créer un compte ne donne pas le droit d'effacer le second facteur d'autrui.
        mockMvc.perform(
                        post("/admin/security/accounts/" + id + "/two-factor/reset")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"reason\":\"Téléphone perdu\"}")
                                .with(asAccountAdmin()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        mockMvc.perform(
                        post("/admin/security/accounts/" + id + "/two-factor/reset")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"reason\":\"Téléphone perdu\"}")
                                .with(asSecurityAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.twoFactor").value("PENDING"));

        Integer leftovers =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM iam.user_account WHERE id = ?::uuid"
                                + " AND (mfa_secret_encrypted IS NOT NULL OR mfa_enabled"
                                + " OR mfa_recovery_code_hashes IS NOT NULL"
                                + " OR mfa_last_accepted_step IS NOT NULL)",
                        Integer.class,
                        id);
        Assertions.assertEquals(0, leftovers);
    }

    @Test
    @DisplayName("refuse à un opérateur de suspendre son propre compte")
    void refusesSelfSuspension() throws Exception {
        String id = create("auto.suspension@example.test");

        mockMvc.perform(
                        post("/admin/security/accounts/" + id + "/status")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"status\":\"SUSPENDED\",\"reason\":\"Erreur de manipulation\"}")
                                .with(
                                        jwt().jwt(builder -> builder.subject(id))
                                                .authorities(
                                                        new SimpleGrantedAuthority("PERM_IAM.USER.WRITE"))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("répond 404 pour un compte inconnu")
    void returnsNotFoundForAnUnknownAccount() throws Exception {
        mockMvc.perform(
                        post("/admin/security/accounts/" + UUID.randomUUID() + "/status")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"status\":\"SUSPENDED\",\"reason\":\"Motif\"}")
                                .with(asAccountAdmin()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("refuse un opérateur sans permission d'écriture")
    void deniesAnOperatorWithoutWritePermission() throws Exception {
        mockMvc.perform(
                        post("/admin/security/accounts")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(createBody("refuse@example.test", "Aminata"))
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("PERM_IAM.USER.READ"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("refuse une création sans rôle attribuable, même avec le droit d'écrire")
    void deniesCreationWithoutRoleAssignPermission() throws Exception {
        mockMvc.perform(
                        post("/admin/security/accounts")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(createBody("sans.role@example.test", "Aminata"))
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("PERM_IAM.USER.WRITE"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("refuse l'anonyme")
    void rejectsAnonymousAccess() throws Exception {
        mockMvc.perform(
                        post("/admin/security/accounts")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(createBody("anonyme@example.test", "Aminata")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
    }
}
