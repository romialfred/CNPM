package ml.cnpm.platform.administration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
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
 * Test de bout en bout du module ADM (l'« étalon »).
 *
 * <p>Il valide la chaîne complète sur un domaine sans enjeu financier : base migrée par
 * Flyway et donnée semée par {@code V3} → JPA → service porteur du {@code @PreAuthorize}
 * → contrôleur → JSON typé du contrat. Si un maillon casse, il casse ici, à bas coût.
 *
 * <p>Trois cas de sécurité sont couverts : accès autorisé (200), rôle insuffisant (403,
 * le test négatif exigé par ADR-008 et {@code .claude/rules/testing.md}) et absence de
 * jeton (401). MockMvc est câblé manuellement : sous Spring Boot 4, l'annotation
 * {@code @AutoConfigureMockMvc} ne fait plus partie de {@code spring-boot-starter-test}.
 */
@SpringBootTest
@Testcontainers
class ReferenceValueApiTest {

    @Container
    @SuppressWarnings("resource")
    private static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer(DockerImageName.parse("postgres:18.4"));

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        // Le broker n'est pas requis pour ce test : des identifiants fictifs font
        // résoudre la configuration, et la sonde de santé RabbitMQ est désactivée pour
        // ne pas tenter — et journaliser en erreur — une connexion vers un broker absent.
        registry.add("spring.rabbitmq.username", () -> "test");
        registry.add("spring.rabbitmq.password", () -> "test");
        registry.add("management.health.rabbit.enabled", () -> "false");
    }

    @Autowired private WebApplicationContext context;
    @Autowired private ml.cnpm.platform.shared.api.CorrelationIdFilter correlationIdFilter;
    @Autowired private JdbcTemplate jdbcTemplate;

    private static final String KEY = "idem-key-0123456789";

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        // Le filtre de corrélation est enregistré automatiquement par Boot dans
        // l'application réelle ; MockMvc ne connaît pas ces filtres de conteneur, on
        // l'ajoute donc explicitement pour éprouver le même comportement.
        this.mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(correlationIdFilter)
                        .apply(springSecurity())
                        .build();
    }

    private static RequestPostProcessor asFunctionalAdmin() {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN_FONCTIONNEL"));
    }

    @Test
    void listsSeededReferenceValuesForAuthorizedRole() throws Exception {
        mockMvc.perform(get("/reference-values").with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.totalElements").isNumber())
                .andExpect(jsonPath("$.items[0].domain").isString())
                .andExpect(jsonPath("$.items[0].code").isString());
    }

    @Test
    void filtersByDomainAndReturnsTheSeededContent() throws Exception {
        // MEMBER_CATEGORY est semé par V3 avec quatre valeurs, ordonnées par sort_order :
        // ACTIVE(1), DORMANT(2), PROSPECT(3), MAJOR_CONTRIBUTOR(4).
        mockMvc.perform(
                        get("/reference-values")
                                .param("domain", "MEMBER_CATEGORY")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.items.length()").value(4))
                .andExpect(jsonPath("$.items[0].code").value("ACTIVE"))
                .andExpect(jsonPath("$.items[0].label").value("Active"))
                .andExpect(jsonPath("$.items[0].sortOrder").value(1))
                .andExpect(jsonPath("$.items[0].active").value(true))
                .andExpect(jsonPath("$.items[3].code").value("MAJOR_CONTRIBUTOR"));
    }

    @Test
    void paginatesWithAStableOrder() throws Exception {
        // Page 0 puis page 1 de taille 2 doivent découper la même liste ordonnée, sans
        // recouvrement — c'est ce qui distingue une vraie pagination d'un simple filtre.
        mockMvc.perform(
                        get("/reference-values")
                                .param("domain", "MEMBER_CATEGORY")
                                .param("page", "0")
                                .param("size", "2")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].code").value("ACTIVE"))
                .andExpect(jsonPath("$.items[1].code").value("DORMANT"));

        mockMvc.perform(
                        get("/reference-values")
                                .param("domain", "MEMBER_CATEGORY")
                                .param("page", "1")
                                .param("size", "2")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.items[0].code").value("PROSPECT"))
                .andExpect(jsonPath("$.items[1].code").value("MAJOR_CONTRIBUTOR"));
    }

    @Test
    void returnsAnEmptyPageForAnUnknownDomain() throws Exception {
        mockMvc.perform(
                        get("/reference-values")
                                .param("domain", "DOMAINE_INEXISTANT")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void echoesTheCorrelationHeaderOnSuccess() throws Exception {
        // Le contrat rend correlationId obligatoire en sortie ; l'en-tête doit reprendre
        // celui fourni par le client.
        String provided = "11111111-1111-1111-1111-111111111111";
        mockMvc.perform(
                        get("/reference-values")
                                .header("X-Correlation-Id", provided)
                                .with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Correlation-Id", provided));
    }

    @Test
    void rendersAPageSizeViolationAsAProblem() throws Exception {
        // Une entrée invalide produit un 400 au format Problem du contrat — code et
        // correlationId présents, type application/problem+json — et non le corps par
        // défaut de Spring.
        mockMvc.perform(get("/reference-values").param("size", "500").with(asFunctionalAdmin()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.correlationId").exists());
    }

    @Test
    void rejectsNegativeLowerBounds() throws Exception {
        mockMvc.perform(get("/reference-values").param("page", "-1").with(asFunctionalAdmin()))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/reference-values").param("size", "0").with(asFunctionalAdmin()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deniesAccessToRoleWithoutReferentialPermission() throws Exception {
        // Rôle authentifié mais dépourvu d'ADMIN.REFERENTIAL.READ : 403, jamais 200.
        mockMvc.perform(
                        get("/reference-values")
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("ROLE_MEMBRE_UTILISATEUR"))))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.correlationId").exists());
    }

    @Test
    void rejectsAnonymousAccess() throws Exception {
        mockMvc.perform(get("/reference-values"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
    }

    private static String body(String domain, String code, String label, int sortOrder) {
        return "{\"domain\":\"%s\",\"code\":\"%s\",\"label\":\"%s\",\"sortOrder\":%d,\"active\":true}"
                .formatted(domain, code, label, sortOrder);
    }

    @Test
    void createsANewReferenceValueAndAuditsIt() throws Exception {
        String responseBody =
                mockMvc.perform(
                                post("/reference-values")
                                        .header("Idempotency-Key", KEY)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(body("TEST_CREATE", "ALPHA", "Alpha", 1))
                                        .with(asFunctionalAdmin()))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.domain").value("TEST_CREATE"))
                        .andExpect(jsonPath("$.code").value("ALPHA"))
                        .andExpect(jsonPath("$.label").value("Alpha"))
                        .andExpect(jsonPath("$.id").exists())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();

        // La création a bien produit un événement d'audit corrélé, avec une empreinte.
        String createdId = JsonPath.read(responseBody, "$.id");
        Integer audited =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM audit.audit_event "
                                + "WHERE entity_id = ?::uuid AND action_code = 'REFERENCE_VALUE.CREATED' "
                                + "AND after_hash IS NOT NULL",
                        Integer.class,
                        createdId);
        org.junit.jupiter.api.Assertions.assertEquals(1, audited);
    }

    @Test
    void replaysAnIdenticalCreateIdempotently() throws Exception {
        String payload = body("TEST_IDEM", "BETA", "Beta", 1);
        mockMvc.perform(
                        post("/reference-values")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload)
                                .with(asFunctionalAdmin()))
                .andExpect(status().isCreated());

        // Rejeu strictement identique : la valeur existante est renvoyée (200), sans
        // doublon ni second effet.
        mockMvc.perform(
                        post("/reference-values")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload)
                                .with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("BETA"));

        Integer rows =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM ref.reference_value WHERE domain = 'TEST_IDEM'",
                        Integer.class);
        org.junit.jupiter.api.Assertions.assertEquals(1, rows);

        // Un rejeu idempotent n'est pas une action : il ne produit pas de second audit.
        // Sans cette assertion, une régression bruitant l'audit à chaque rejeu passerait.
        Integer audited =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM audit.audit_event a "
                                + "JOIN ref.reference_value r ON r.id = a.entity_id "
                                + "WHERE r.domain = 'TEST_IDEM' AND a.action_code = 'REFERENCE_VALUE.CREATED'",
                        Integer.class);
        org.junit.jupiter.api.Assertions.assertEquals(1, audited);
    }

    @Test
    void rejectsCreateOfDivergentContentForTheSameKey() throws Exception {
        String created =
                mockMvc.perform(
                                post("/reference-values")
                                        .header("Idempotency-Key", KEY)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(body("TEST_CONFLICT", "GAMMA", "Gamma", 1))
                                        .with(asFunctionalAdmin()))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();

        // Même (domaine, code) mais libellé différent : conflit d'état, pas un doublon.
        mockMvc.perform(
                        post("/reference-values")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("TEST_CONFLICT", "GAMMA", "Gamma modifié", 2))
                                .with(asFunctionalAdmin()))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("STATE_CONFLICT"));

        // Une tentative rejetée n'a produit ni ligne ni audit : seul le premier create
        // compte. Un audit émis sur le chemin de conflit serait un faux positif de trace.
        String createdId = JsonPath.read(created, "$.id");
        Integer audited =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM audit.audit_event WHERE entity_id = ?::uuid",
                        Integer.class,
                        createdId);
        org.junit.jupiter.api.Assertions.assertEquals(1, audited);
    }

    @Test
    void rejectsAnIdempotencyKeyShorterThanTheContractMinimum() throws Exception {
        // Le contrat impose une clé d'au moins 16 caractères ; une clé trop courte est
        // une validation, rendue au format Problem.
        mockMvc.perform(
                        post("/reference-values")
                                .header("Idempotency-Key", "trop-courte")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("TEST_SHORTKEY", "X", "X", 1))
                                .with(asFunctionalAdmin()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void recordsTheKeycloakSubjectAsAuditActor() throws Exception {
        // Chemin où le sujet du jeton est un vrai UUID (cas Keycloak) : l'acteur de
        // l'audit doit être ce sujet, pas null.
        String subject = "22222222-2222-2222-2222-222222222222";
        String responseBody =
                mockMvc.perform(
                                post("/reference-values")
                                        .header("Idempotency-Key", KEY)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(body("TEST_ACTOR", "DELTA", "Delta", 1))
                                        .with(
                                                jwt()
                                                        .jwt(j -> j.subject(subject))
                                                        .authorities(
                                                                new SimpleGrantedAuthority("ROLE_ADMIN_FONCTIONNEL"))))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();

        String createdId = JsonPath.read(responseBody, "$.id");
        String actor =
                jdbcTemplate.queryForObject(
                        "SELECT actor_user_id::text FROM audit.audit_event WHERE entity_id = ?::uuid",
                        String.class,
                        createdId);
        org.junit.jupiter.api.Assertions.assertEquals(subject, actor);
    }

    @Test
    void deniesCreateToRoleWithoutWritePermission() throws Exception {
        mockMvc.perform(
                        post("/reference-values")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("TEST_FORBIDDEN", "X", "X", 1))
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("ROLE_MEMBRE_UTILISATEUR"))))
                .andExpect(status().isForbidden());
        // Rien n'a été inséré malgré la charge valide : l'autorisation précède l'effet.
        Integer rows =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM ref.reference_value WHERE domain = 'TEST_FORBIDDEN'",
                        Integer.class);
        org.junit.jupiter.api.Assertions.assertEquals(0, rows);
    }

    @Test
    void rejectsCreateWithoutIdempotencyKey() throws Exception {
        mockMvc.perform(
                        post("/reference-values")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("TEST_NOKEY", "X", "X", 1))
                                .with(asFunctionalAdmin()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void rejectsCreateWithABlankRequiredField() throws Exception {
        mockMvc.perform(
                        post("/reference-values")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"domain\":\"TEST\",\"code\":\"X\",\"label\":\"\"}")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    private String createAndReturnBody(String domain, String code, String label) throws Exception {
        return mockMvc.perform(
                        post("/reference-values")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body(domain, code, label, 1))
                                .with(asFunctionalAdmin()))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
    }

    @Test
    void updatesAValueUnderOptimisticLockAndAuditsIt() throws Exception {
        String created = createAndReturnBody("TEST_UPDATE", "U1", "Avant");
        String id = JsonPath.read(created, "$.id");
        Integer version = JsonPath.read(created, "$.version");

        mockMvc.perform(
                        patch("/reference-values/{id}", id)
                                .header("If-Match", String.valueOf(version))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"label\":\"Après\",\"active\":false}")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("Après"))
                .andExpect(jsonPath("$.active").value(false))
                // Le domaine et le code, identité, restent inchangés.
                .andExpect(jsonPath("$.domain").value("TEST_UPDATE"))
                .andExpect(jsonPath("$.code").value("U1"))
                // La version a été incrémentée par le verrou optimiste.
                .andExpect(jsonPath("$.version").value(version + 1));

        // La mise à jour est auditée avec une empreinte avant ET après.
        Integer audited =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM audit.audit_event WHERE entity_id = ?::uuid "
                                + "AND action_code = 'REFERENCE_VALUE.UPDATED' "
                                + "AND before_hash IS NOT NULL AND after_hash IS NOT NULL",
                        Integer.class,
                        id);
        org.junit.jupiter.api.Assertions.assertEquals(1, audited);
    }

    @Test
    void rejectsAnUpdateOnAStaleVersion() throws Exception {
        String created = createAndReturnBody("TEST_STALE", "U2", "Avant");
        String id = JsonPath.read(created, "$.id");

        // Version attendue erronée : la modification est refusée sans être tentée.
        mockMvc.perform(
                        patch("/reference-values/{id}", id)
                                .header("If-Match", "999")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"label\":\"Ne doit pas passer\"}")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("STATE_CONFLICT"));

        // Rien n'a changé, aucun audit de mise à jour.
        String label =
                jdbcTemplate.queryForObject(
                        "SELECT label FROM ref.reference_value WHERE id = ?::uuid", String.class, id);
        org.junit.jupiter.api.Assertions.assertEquals("Avant", label);
        Integer updateAudits =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM audit.audit_event WHERE entity_id = ?::uuid "
                                + "AND action_code = 'REFERENCE_VALUE.UPDATED'",
                        Integer.class,
                        id);
        org.junit.jupiter.api.Assertions.assertEquals(0, updateAudits);
    }

    @Test
    void appliesOnlyTheProvidedFieldsOnAPartialUpdate() throws Exception {
        // Création avec sortOrder=1, active=true ; un PATCH ne portant que le libellé
        // laisse sortOrder et active inchangés (sémantique PATCH réellement partielle).
        String created = createAndReturnBody("TEST_PARTIAL", "P1", "Avant");
        String id = JsonPath.read(created, "$.id");
        Integer version = JsonPath.read(created, "$.version");

        mockMvc.perform(
                        patch("/reference-values/{id}", id)
                                .header("If-Match", String.valueOf(version))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"label\":\"Après\"}")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("Après"))
                .andExpect(jsonPath("$.sortOrder").value(1))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void treatsAnEmptyPatchAsANoOpWithoutAuditOrVersionBump() throws Exception {
        // Un corps vide ne modifie rien : ni version incrémentée, ni audit « mise à jour »
        // (un événement sans changement serait un faux positif de trace).
        String created = createAndReturnBody("TEST_NOOP", "N1", "Inchangé");
        String id = JsonPath.read(created, "$.id");
        Integer version = JsonPath.read(created, "$.version");

        mockMvc.perform(
                        patch("/reference-values/{id}", id)
                                .header("If-Match", String.valueOf(version))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("Inchangé"))
                .andExpect(jsonPath("$.version").value(version));

        Integer updateAudits =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM audit.audit_event WHERE entity_id = ?::uuid "
                                + "AND action_code = 'REFERENCE_VALUE.UPDATED'",
                        Integer.class,
                        id);
        org.junit.jupiter.api.Assertions.assertEquals(0, updateAudits);
    }

    @Test
    void rejectsAnUpdateWithABlankLabel() throws Exception {
        String created = createAndReturnBody("TEST_BLANK", "B1", "Avant");
        String id = JsonPath.read(created, "$.id");
        mockMvc.perform(
                        patch("/reference-values/{id}", id)
                                .header("If-Match", "0")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"label\":\"\"}")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void rendersANonNumericIfMatchAsANormalizedProblem() throws Exception {
        String created = createAndReturnBody("TEST_BADMATCH", "M1", "Avant");
        String id = JsonPath.read(created, "$.id");
        mockMvc.perform(
                        patch("/reference-values/{id}", id)
                                .header("If-Match", "pas-un-nombre")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"label\":\"X\"}")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.correlationId").exists());
    }

    @Test
    void returnsNotFoundWhenUpdatingAnUnknownId() throws Exception {
        mockMvc.perform(
                        patch("/reference-values/{id}", "00000000-0000-0000-0000-000000000000")
                                .header("If-Match", "0")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"label\":\"X\"}")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    void requiresAnIfMatchHeaderToUpdate() throws Exception {
        String created = createAndReturnBody("TEST_NOMATCH", "U3", "Avant");
        String id = JsonPath.read(created, "$.id");
        mockMvc.perform(
                        patch("/reference-values/{id}", id)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"label\":\"X\"}")
                                .with(asFunctionalAdmin()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void deniesUpdateToRoleWithoutWritePermission() throws Exception {
        String created = createAndReturnBody("TEST_UPD_FORBIDDEN", "U4", "Avant");
        String id = JsonPath.read(created, "$.id");
        mockMvc.perform(
                        patch("/reference-values/{id}", id)
                                .header("If-Match", "0")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"label\":\"X\"}")
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("ROLE_MEMBRE_UTILISATEUR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void auditsAnAuthorizationDenialAsASecurityEvent() throws Exception {
        // ADR-008 exigeait une trace des tentatives de dépassement de droits : un refus
        // (403) produit désormais un événement de sécurité.
        Integer before =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM audit.security_event WHERE event_type = 'AUTHORIZATION_DENIED'",
                        Integer.class);
        mockMvc.perform(
                        get("/reference-values")
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("ROLE_MEMBRE_UTILISATEUR"))))
                .andExpect(status().isForbidden());
        Integer after =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM audit.security_event WHERE event_type = 'AUTHORIZATION_DENIED'",
                        Integer.class);
        org.junit.jupiter.api.Assertions.assertEquals(before + 1, after);
    }

    /** Décodeur factice : évite toute récupération réseau des métadonnées OIDC au démarrage. */
    @TestConfiguration
    static class JwtDecoderStub {
        @Bean
        JwtDecoder jwtDecoder() {
            return token -> Jwt.withTokenValue(token).header("alg", "none").subject("test").build();
        }
    }
}
