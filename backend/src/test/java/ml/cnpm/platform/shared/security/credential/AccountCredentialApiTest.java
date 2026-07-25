package ml.cnpm.platform.shared.security.credential;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.security.crypto.password.PasswordEncoder;
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
 * Activation d'un compte et récupération d'accès, de bout en bout.
 *
 * <p>La propriété centrale : <b>le mot de passe ne transite jamais par l'administration</b>.
 * L'opérateur n'obtient qu'un jeton à usage unique ; le titulaire pose son secret lui-même.
 * Les cas négatifs — jeton rejoué, jeton périmé, jeton invalidé par une nouvelle émission,
 * mot de passe trop court, compte suspendu — comptent autant que le cas nominal : chacun
 * d'eux, s'il passait, rouvrirait un accès qu'on croit fermé.
 */
@SpringBootTest
@Testcontainers
class AccountCredentialApiTest {

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

    private static final String PASSWORD = "correct-cheval-pile-2026";

    @Autowired private WebApplicationContext context;
    @Autowired private ml.cnpm.platform.shared.api.CorrelationIdFilter correlationIdFilter;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;
    private UUID account;

    @BeforeEach
    void setUp() {
        this.mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(correlationIdFilter)
                        .apply(springSecurity())
                        .build();

        jdbcTemplate.update("DELETE FROM iam.user_account WHERE email LIKE '%@credential.test'");
        this.account =
                jdbcTemplate.queryForObject(
                        "INSERT INTO iam.user_account (email, display_name, account_type, status)"
                                + " VALUES ('titulaire@credential.test', 'Titulaire', 'PROFESSIONAL',"
                                + " 'ACTIVE') RETURNING id",
                        UUID.class);
    }

    private static RequestPostProcessor asAccountAdmin() {
        return jwt().authorities(new SimpleGrantedAuthority("PERM_IAM.USER.WRITE"));
    }

    private String issueToken() throws Exception {
        String body =
                mockMvc.perform(
                                post("/admin/security/accounts/" + account + "/password-reset")
                                        .with(asAccountAdmin()))
                        .andExpect(status().isOk())
                        // Le compte n'a pas de mot de passe : c'est une activation, pas une
                        // « réinitialisation », et l'écran ne doit pas dire le contraire.
                        .andExpect(jsonPath("$.activation").value(true))
                        .andExpect(jsonPath("$.expiresAt").isString())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        return JsonPath.read(body, "$.token");
    }

    private static String setPasswordBody(String token, String password) {
        return "{\"token\":\"%s\",\"password\":\"%s\"}".formatted(token, password);
    }

    @Test
    @DisplayName("le titulaire pose son mot de passe ; l’administration ne le voit jamais")
    void theHolderSetsTheirOwnPassword() throws Exception {
        String token = issueToken();

        // Le jeton n'est jamais stocké en clair : la base n'en garde que l'empreinte.
        Integer inClear =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM iam.account_credential_token WHERE token_hash = ?",
                        Integer.class,
                        token);
        Assertions.assertEquals(0, inClear);

        mockMvc.perform(
                        post("/auth/password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(setPasswordBody(token, PASSWORD)))
                .andExpect(status().isNoContent());

        String hash =
                jdbcTemplate.queryForObject(
                        "SELECT password_hash FROM iam.user_account WHERE id = ?", String.class, account);
        Assertions.assertNotNull(hash);
        // Le mot de passe n'est pas conservé tel quel, et l'empreinte le reconnaît.
        Assertions.assertNotEquals(PASSWORD, hash);
        Assertions.assertTrue(passwordEncoder.matches(PASSWORD, hash));
    }

    @Test
    @DisplayName("un jeton ne sert qu’une fois")
    void aTokenIsSingleUse() throws Exception {
        String token = issueToken();
        mockMvc.perform(
                        post("/auth/password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(setPasswordBody(token, PASSWORD)))
                .andExpect(status().isNoContent());

        mockMvc.perform(
                        post("/auth/password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(setPasswordBody(token, "un-autre-mot-de-passe-2026")))
                .andExpect(status().isConflict());

        // Le second essai n'a pas remplacé le mot de passe posé par le premier.
        String hash =
                jdbcTemplate.queryForObject(
                        "SELECT password_hash FROM iam.user_account WHERE id = ?", String.class, account);
        Assertions.assertTrue(passwordEncoder.matches(PASSWORD, hash));
    }

    @Test
    @DisplayName("émettre un nouveau jeton invalide le précédent")
    void issuingANewTokenInvalidatesTheFormerOne() throws Exception {
        String first = issueToken();
        String second = issueToken();
        Assertions.assertNotEquals(first, second);

        mockMvc.perform(
                        post("/auth/password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(setPasswordBody(first, PASSWORD)))
                .andExpect(status().isConflict());

        mockMvc.perform(
                        post("/auth/password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(setPasswordBody(second, PASSWORD)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("un jeton périmé est refusé")
    void anExpiredTokenIsRefused() throws Exception {
        String token = issueToken();
        jdbcTemplate.update(
                "UPDATE iam.account_credential_token SET expires_at = now() - INTERVAL '1 minute'"
                        + " WHERE user_id = ?",
                account);

        mockMvc.perform(
                        post("/auth/password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(setPasswordBody(token, PASSWORD)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("un jeton inconnu est refusé sans révéler pourquoi")
    void anUnknownTokenIsRefused() throws Exception {
        mockMvc.perform(
                        post("/auth/password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(setPasswordBody("jeton-fabrique-de-toutes-pieces", PASSWORD)))
                .andExpect(status().isConflict())
                .andExpect(
                        org.springframework.test.web.servlet.result.MockMvcResultMatchers.content()
                                .contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    @DisplayName("un mot de passe trop court est refusé")
    void aShortPasswordIsRefused() throws Exception {
        String token = issueToken();

        mockMvc.perform(
                        post("/auth/password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(setPasswordBody(token, "court")))
                .andExpect(status().isBadRequest());

        // Le refus ne consomme pas le jeton : l'utilisateur peut corriger sa saisie.
        mockMvc.perform(
                        post("/auth/password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(setPasswordBody(token, PASSWORD)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("refuse de rétablir l’accès d’un compte suspendu")
    void refusesToRestoreASuspendedAccount() throws Exception {
        jdbcTemplate.update("UPDATE iam.user_account SET status = 'SUSPENDED' WHERE id = ?", account);

        mockMvc.perform(
                        post("/admin/security/accounts/" + account + "/password-reset")
                                .with(asAccountAdmin()))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("émettre un jeton exige la permission d’écriture sur les comptes")
    void issuingRequiresWritePermission() throws Exception {
        mockMvc.perform(
                        post("/admin/security/accounts/" + account + "/password-reset")
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("PERM_IAM.USER.READ"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/admin/security/accounts/" + account + "/password-reset"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("répond 404 pour un compte inconnu")
    void returnsNotFoundForAnUnknownAccount() throws Exception {
        mockMvc.perform(
                        post("/admin/security/accounts/" + UUID.randomUUID() + "/password-reset")
                                .with(asAccountAdmin()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("consigne l’émission et la pose sans jamais journaliser le secret")
    void auditsWithoutLeakingTheSecret() throws Exception {
        String token = issueToken();
        mockMvc.perform(
                        post("/auth/password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(setPasswordBody(token, PASSWORD)))
                .andExpect(status().isNoContent());

        Integer audited =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM audit.audit_event WHERE entity_id = ?"
                                + " AND action_code IN ('USER_ACCOUNT.CREDENTIAL_TOKEN_ISSUED',"
                                + " 'USER_ACCOUNT.PASSWORD_SET')",
                        Integer.class,
                        account);
        Assertions.assertEquals(2, audited);

        // Ni le jeton ni le mot de passe ne doivent apparaître dans une empreinte d'audit.
        Integer leaked =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM audit.audit_event"
                                + " WHERE after_hash LIKE ? OR after_hash LIKE ?",
                        Integer.class,
                        "%" + token + "%",
                        "%" + PASSWORD + "%");
        Assertions.assertEquals(0, leaked);
    }
}
