package ml.cnpm.platform.member;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
 * Test de bout en bout de {@code createOrganization} (POST /organizations) — le premier
 * chemin d'écriture du module MEMBER.
 *
 * <p>Valide l'idempotence par clé naturelle (identifiant métier), l'audit transactionnel,
 * le conflit d'état, l'exigence de l'en-tête {@code Idempotency-Key}, la validation de
 * forme et l'autorisation par permission {@code MEMBER.WRITE}. Données synthétiques.
 */
@SpringBootTest
@Testcontainers
class OrganizationWriteApiTest {

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

    private static final String IDEMPOTENCY_KEY = "idem-0000000000001";

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
        // organization n'est pas append-only ; la suppression cascade sur l'identifiant.
        // audit_event est append-only : on ne le purge pas — les assertions d'audit sont
        // bornées à l'entreprise créée (id aléatoire), donc insensibles à l'accumulation.
        jdbcTemplate.update("DELETE FROM member.organization");
    }

    private static RequestPostProcessor asMemberWriter() {
        return jwt().authorities(new SimpleGrantedAuthority("PERM_MEMBER.WRITE"));
    }

    private static String body(String legalName, String identifierType, String identifierValue) {
        return """
                {
                  "legalName": "%s",
                  "tradeName": "Sahel",
                  "organizationType": "GRANDE_ENTREPRISE",
                  "sectorCode": "AGRI",
                  "identifierType": "%s",
                  "identifierValue": "%s"
                }
                """
                .formatted(legalName, identifierType, identifierValue);
    }

    private long count(String sql, Object... args) {
        return jdbcTemplate.queryForObject(sql, Long.class, args);
    }

    @Test
    void createsAnOrganizationAndReturns201() throws Exception {
        String id =
                com.jayway.jsonpath.JsonPath.read(
                        mockMvc.perform(
                                        post("/organizations")
                                                .header("Idempotency-Key", IDEMPOTENCY_KEY)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(body("Sahel Agro SA", "RCCM", "ML-2024-A-001"))
                                                .with(asMemberWriter()))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").exists())
                                .andExpect(jsonPath("$.legalName").value("Sahel Agro SA"))
                                // Statut et niveau de risque initiaux imposés par le serveur.
                                .andExpect(jsonPath("$.status").value("PROSPECT"))
                                .andExpect(jsonPath("$.riskLevel").value("NORMAL"))
                                .andExpect(jsonPath("$.version").exists())
                                .andReturn()
                                .getResponse()
                                .getContentAsString(),
                        "$.id");

        // Entreprise + identifiant métier persistés.
        org.junit.jupiter.api.Assertions.assertEquals(
                1L, count("SELECT count(*) FROM member.organization WHERE id = ?::uuid", id));
        org.junit.jupiter.api.Assertions.assertEquals(
                1L,
                count(
                        "SELECT count(*) FROM member.organization_identifier "
                                + "WHERE organization_id = ?::uuid AND identifier_type = 'RCCM' "
                                + "AND identifier_value = 'ML-2024-A-001'",
                        id));
        // Un événement d'audit corrélé écrit dans la même transaction.
        org.junit.jupiter.api.Assertions.assertEquals(
                1L,
                count(
                        "SELECT count(*) FROM audit.audit_event "
                                + "WHERE entity_id = ?::uuid AND action_code = 'ORGANIZATION.CREATED'",
                        id));
    }

    @Test
    void replaysAnIdenticalCreationAsIdempotent200() throws Exception {
        String first =
                com.jayway.jsonpath.JsonPath.read(
                        mockMvc.perform(
                                        post("/organizations")
                                                .header("Idempotency-Key", IDEMPOTENCY_KEY)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(body("Bamako Textiles SA", "RCCM", "ML-2024-B-002"))
                                                .with(asMemberWriter()))
                                .andExpect(status().isCreated())
                                .andReturn()
                                .getResponse()
                                .getContentAsString(),
                        "$.id");

        // Rejeu strictement identique : 200, même identité, aucun doublon ni second audit.
        mockMvc.perform(
                        post("/organizations")
                                .header("Idempotency-Key", IDEMPOTENCY_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("Bamako Textiles SA", "RCCM", "ML-2024-B-002"))
                                .with(asMemberWriter()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(first));

        org.junit.jupiter.api.Assertions.assertEquals(
                1L,
                count(
                        "SELECT count(*) FROM member.organization_identifier "
                                + "WHERE identifier_type = 'RCCM' AND identifier_value = 'ML-2024-B-002'"));
        org.junit.jupiter.api.Assertions.assertEquals(
                1L,
                count(
                        "SELECT count(*) FROM audit.audit_event "
                                + "WHERE entity_id = ?::uuid AND action_code = 'ORGANIZATION.CREATED'",
                        first));
    }

    @Test
    void conflictsWhenIdentifierIsReusedWithDifferentContent() throws Exception {
        mockMvc.perform(
                        post("/organizations")
                                .header("Idempotency-Key", IDEMPOTENCY_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("Kayes Mines SA", "RCCM", "ML-2024-C-003"))
                                .with(asMemberWriter()))
                .andExpect(status().isCreated());

        // Même identifiant métier, raison sociale différente : conflit d'état.
        mockMvc.perform(
                        post("/organizations")
                                .header("Idempotency-Key", IDEMPOTENCY_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("Autre Société SA", "RCCM", "ML-2024-C-003"))
                                .with(asMemberWriter()))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("STATE_CONFLICT"));
    }

    @Test
    void requiresTheIdempotencyKey() throws Exception {
        mockMvc.perform(
                        post("/organizations")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("Sans Clé SA", "RCCM", "ML-2024-D-004"))
                                .with(asMemberWriter()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsAnIdempotencyKeyBelowTheMinimumLength() throws Exception {
        mockMvc.perform(
                        post("/organizations")
                                .header("Idempotency-Key", "trop-court")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("Courte Clé SA", "RCCM", "ML-2024-E-005"))
                                .with(asMemberWriter()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsABlankLegalName() throws Exception {
        mockMvc.perform(
                        post("/organizations")
                                .header("Idempotency-Key", IDEMPOTENCY_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("", "RCCM", "ML-2024-F-006"))
                                .with(asMemberWriter()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void rejectsAMissingBusinessIdentifier() throws Exception {
        mockMvc.perform(
                        post("/organizations")
                                .header("Idempotency-Key", IDEMPOTENCY_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("Sans Identifiant SA", "RCCM", ""))
                                .with(asMemberWriter()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void deniesCreationWithoutTheMemberWritePermission() throws Exception {
        // MEMBER.READ ne suffit pas : l'écriture exige MEMBER.WRITE.
        mockMvc.perform(
                        post("/organizations")
                                .header("Idempotency-Key", IDEMPOTENCY_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("Refusée SA", "RCCM", "ML-2024-G-007"))
                                .with(jwt().authorities(new SimpleGrantedAuthority("PERM_MEMBER.READ"))))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void rejectsAMalformedJsonBodyWithANormalizedProblem() throws Exception {
        // Corps JSON syntaxiquement invalide : doit rester au format Problem normalisé, pas
        // le corps d'erreur par défaut de Spring (sans code ni content-type conforme).
        mockMvc.perform(
                        post("/organizations")
                                .header("Idempotency-Key", IDEMPOTENCY_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"legalName\": ")
                                .with(asMemberWriter()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void rejectsAnAbsentBodyWithANormalizedProblem() throws Exception {
        mockMvc.perform(
                        post("/organizations")
                                .header("Idempotency-Key", IDEMPOTENCY_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .with(asMemberWriter()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void rejectsAnonymousCreation() throws Exception {
        mockMvc.perform(
                        post("/organizations")
                                .header("Idempotency-Key", IDEMPOTENCY_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("Anonyme SA", "RCCM", "ML-2024-H-008")))
                .andExpect(status().isUnauthorized());
    }

    private void insertOrganizationRow(String id, String legalName) {
        jdbcTemplate.update(
                "INSERT INTO member.organization "
                        + "(id, legal_name, organization_type, status, risk_level, version) "
                        + "VALUES (?::uuid, ?, 'PME', 'ACTIVE', 'NORMAL', 0)",
                id,
                legalName);
    }

    @Test
    void updatesAnOrganizationUnderOptimisticLock() throws Exception {
        String id = "22222222-1111-0000-0000-000000000001";
        insertOrganizationRow(id, "Original SA");

        mockMvc.perform(
                        patch("/organizations/{id}", id)
                                .header("If-Match", "0")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"legalName\": \"Nouvelle Raison SA\", \"sectorCode\": \"BTP\" }")
                                .with(asMemberWriter()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.legalName").value("Nouvelle Raison SA"))
                .andExpect(jsonPath("$.sectorCode").value("BTP"))
                // Champ non fourni inchangé, version incrémentée par le verrou optimiste.
                .andExpect(jsonPath("$.organizationType").value("PME"))
                .andExpect(jsonPath("$.version").value(1));

        // L'audit porte des empreintes avant/après réelles (non nulles).
        org.junit.jupiter.api.Assertions.assertEquals(
                1L,
                count(
                        "SELECT count(*) FROM audit.audit_event "
                                + "WHERE entity_id = ?::uuid AND action_code = 'ORGANIZATION.UPDATED' "
                                + "AND before_hash IS NOT NULL AND after_hash IS NOT NULL "
                                + "AND before_hash <> after_hash",
                        id));
    }

    @Test
    void recordsTheKeycloakSubjectAsAuditActor() throws Exception {
        String id = "22222222-1111-0000-0000-000000000021";
        String actor = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        insertOrganizationRow(id, "Acteur SA");

        mockMvc.perform(
                        patch("/organizations/{id}", id)
                                .header("If-Match", "0")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"legalName\": \"Acteur Modifié SA\" }")
                                .with(
                                        jwt().jwt(j -> j.subject(actor))
                                                .authorities(new SimpleGrantedAuthority("PERM_MEMBER.WRITE"))))
                .andExpect(status().isOk());

        // Le sujet Keycloak (UUID) est bien enregistré comme acteur de l'audit.
        org.junit.jupiter.api.Assertions.assertEquals(
                actor,
                jdbcTemplate.queryForObject(
                        "SELECT actor_user_id::text FROM audit.audit_event "
                                + "WHERE entity_id = ?::uuid AND action_code = 'ORGANIZATION.UPDATED'",
                        String.class,
                        id));
    }

    @Test
    void doesNotAuditWhenThePatchChangesNothing() throws Exception {
        // Resoumission d'un formulaire sans modification réelle (valeurs identiques à
        // l'existant) : 200, mais aucun UPDATE réel (version inchangée) donc aucun faux
        // audit dans le journal append-only.
        String id = "22222222-1111-0000-0000-000000000022";
        insertOrganizationRow(id, "Identique SA");

        mockMvc.perform(
                        patch("/organizations/{id}", id)
                                .header("If-Match", "0")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"legalName\": \"Identique SA\" }")
                                .with(asMemberWriter()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.legalName").value("Identique SA"))
                .andExpect(jsonPath("$.version").value(0));

        org.junit.jupiter.api.Assertions.assertEquals(
                0L,
                count(
                        "SELECT count(*) FROM audit.audit_event "
                                + "WHERE entity_id = ?::uuid AND action_code = 'ORGANIZATION.UPDATED'",
                        id));
    }

    @Test
    void requiresTheIfMatchHeaderToUpdate() throws Exception {
        String id = "22222222-1111-0000-0000-000000000023";
        insertOrganizationRow(id, "SansIfMatch SA");

        mockMvc.perform(
                        patch("/organizations/{id}", id)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"legalName\": \"X SA\" }")
                                .with(asMemberWriter()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void conflictsWhenIfMatchVersionIsStale() throws Exception {
        String id = "22222222-1111-0000-0000-000000000002";
        insertOrganizationRow(id, "Concurrente SA");

        mockMvc.perform(
                        patch("/organizations/{id}", id)
                                .header("If-Match", "5")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"legalName\": \"Écrasée SA\" }")
                                .with(asMemberWriter()))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("STATE_CONFLICT"));
    }

    @Test
    void returnsNotFoundWhenUpdatingAnUnknownOrganization() throws Exception {
        mockMvc.perform(
                        patch("/organizations/{id}", "22222222-1111-0000-0000-0000000000ff")
                                .header("If-Match", "0")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"legalName\": \"Fantôme SA\" }")
                                .with(asMemberWriter()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    void treatsAnEmptyPatchAsANoOpWithoutAudit() throws Exception {
        String id = "22222222-1111-0000-0000-000000000003";
        insertOrganizationRow(id, "Inchangée SA");

        mockMvc.perform(
                        patch("/organizations/{id}", id)
                                .header("If-Match", "0")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}")
                                .with(asMemberWriter()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.legalName").value("Inchangée SA"))
                // Aucun changement : version inchangée, aucun audit de mise à jour.
                .andExpect(jsonPath("$.version").value(0));

        org.junit.jupiter.api.Assertions.assertEquals(
                0L,
                count(
                        "SELECT count(*) FROM audit.audit_event "
                                + "WHERE entity_id = ?::uuid AND action_code = 'ORGANIZATION.UPDATED'",
                        id));
    }

    @Test
    void rejectsANonNumericIfMatch() throws Exception {
        String id = "22222222-1111-0000-0000-000000000004";
        insertOrganizationRow(id, "MauvaiseVersion SA");

        mockMvc.perform(
                        patch("/organizations/{id}", id)
                                .header("If-Match", "pas-un-nombre")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"legalName\": \"X SA\" }")
                                .with(asMemberWriter()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void deniesUpdateWithoutTheMemberWritePermission() throws Exception {
        String id = "22222222-1111-0000-0000-000000000005";
        insertOrganizationRow(id, "Protégée SA");

        mockMvc.perform(
                        patch("/organizations/{id}", id)
                                .header("If-Match", "0")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"legalName\": \"Interdite SA\" }")
                                .with(jwt().authorities(new SimpleGrantedAuthority("PERM_MEMBER.READ"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void rejectsAnonymousUpdate() throws Exception {
        mockMvc.perform(
                        patch("/organizations/{id}", "22222222-1111-0000-0000-000000000006")
                                .header("If-Match", "0")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"legalName\": \"Anonyme SA\" }"))
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
