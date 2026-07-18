package ml.cnpm.platform.enrollment;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
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
 * Test de bout en bout du cycle de vie du dossier d'adhésion (module ENROLLMENT).
 *
 * <p>Vérifie la machine à états de {@code docs/07-processes/state-machines.md} — transitions
 * autorisées ET refusées, en particulier qu'<strong>aucune décision n'est possible sans
 * passage par le contrôle</strong> — la séparation des tâches CREATE/REVIEW/APPROVE, la
 * traçabilité nominative des décisions et l'audit de chaque transition. Les tables de revue et
 * de décision étant append-only, aucun test ne purge : chacun emploie son propre numéro de
 * dossier. Données synthétiques uniquement.
 */
@SpringBootTest
@Testcontainers
class EnrollmentApiTest {

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

    private static final String ORG_ID = "12345678-0000-0000-0000-000000000001";
    private static final String ORG_ID_2 = "12345678-0000-0000-0000-000000000002";
    private static final String KEY = "idem-0000000000001";
    private static final String ACTOR = "99999999-8888-7777-6666-555555555555";

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
        insertOrganization(ORG_ID, "Adhérente SA");
        insertOrganization(ORG_ID_2, "Autre SA");
    }

    private void insertOrganization(String id, String name) {
        jdbcTemplate.update(
                "INSERT INTO member.organization (id, legal_name, organization_type, status, risk_level) "
                        + "VALUES (?::uuid, ?, 'PME', 'PROSPECT', 'NORMAL') ON CONFLICT (id) DO NOTHING",
                id,
                name);
    }

    /** Acteur porteur d'un sujet UUID : requis pour toute transition (imputabilité). */
    private static RequestPostProcessor as(String... authorities) {
        var post = jwt().jwt(j -> j.subject(ACTOR));
        SimpleGrantedAuthority[] granted = new SimpleGrantedAuthority[authorities.length];
        for (int i = 0; i < authorities.length; i++) {
            granted[i] = new SimpleGrantedAuthority(authorities[i]);
        }
        return post.authorities(granted);
    }

    private static RequestPostProcessor asCreator() {
        return as("PERM_ENROLLMENT.CREATE");
    }

    private static RequestPostProcessor asReviewer() {
        return as("PERM_ENROLLMENT.REVIEW");
    }

    private static RequestPostProcessor asApprover() {
        return as("PERM_ENROLLMENT.APPROVE");
    }

    private static String body(String caseNumber, String orgId) {
        return """
                { "caseNumber": "%s", "organizationId": "%s", "channel": "WEB" }
                """
                .formatted(caseNumber, orgId);
    }

    private String createCase(String caseNumber) throws Exception {
        String responseBody =
                mockMvc.perform(
                                post("/enrollment-applications")
                                        .header("Idempotency-Key", KEY)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(body(caseNumber, ORG_ID))
                                        .with(asCreator()))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        return JsonPath.read(responseBody, "$.id");
    }

    private String submitted(String caseNumber) throws Exception {
        String id = createCase(caseNumber);
        mockMvc.perform(
                        post("/enrollment-applications/{id}/submit", id)
                                .header("Idempotency-Key", KEY)
                                .with(asCreator()))
                .andExpect(status().isOk());
        return id;
    }

    /** Dossier pris en charge : seul état depuis lequel une décision est possible. */
    private String underReview(String caseNumber) throws Exception {
        String id = submitted(caseNumber);
        mockMvc.perform(post("/enrollment-applications/{id}/start-review", id).with(asReviewer()))
                .andExpect(status().isOk());
        return id;
    }

    private long count(String sql, Object... args) {
        return jdbcTemplate.queryForObject(sql, Long.class, args);
    }

    private long auditCount(String caseId, String action) {
        return count(
                "SELECT count(*) FROM audit.audit_event "
                        + "WHERE entity_id = ?::uuid AND action_code = ? AND correlation_id IS NOT NULL",
                caseId,
                action);
    }

    @Test
    void createsADraftApplicationAndAuditsIt() throws Exception {
        String id = createCase("ENR-2026-0001");

        Assertions.assertEquals(
                1L,
                count(
                        "SELECT count(*) FROM enrollment.enrollment_case "
                                + "WHERE id = ?::uuid AND status = 'DRAFT'",
                        id));
        Assertions.assertEquals(1L, auditCount(id, "ENROLLMENT_CASE.CREATED"));
    }

    @Test
    void replaysAnIdenticalCreationIdempotently() throws Exception {
        String first = createCase("ENR-2026-0002");

        mockMvc.perform(
                        post("/enrollment-applications")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("ENR-2026-0002", ORG_ID))
                                .with(asCreator()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(first));

        Assertions.assertEquals(1L, auditCount(first, "ENROLLMENT_CASE.CREATED"));
    }

    @Test
    void conflictsWhenCaseNumberIsReusedForAnotherOrganization() throws Exception {
        createCase("ENR-2026-0003");

        mockMvc.perform(
                        post("/enrollment-applications")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("ENR-2026-0003", ORG_ID_2))
                                .with(asCreator()))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("STATE_CONFLICT"));
    }

    @Test
    void submitsADraftStampsTheDateAndAuditsIt() throws Exception {
        String id = createCase("ENR-2026-0004");

        mockMvc.perform(
                        post("/enrollment-applications/{id}/submit", id)
                                .header("Idempotency-Key", KEY)
                                .with(asCreator()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.submittedAt").exists());

        Assertions.assertEquals(1L, auditCount(id, "ENROLLMENT_CASE.SUBMITTED"));
    }

    @Test
    void refusesToSubmitAnAlreadySubmittedApplication() throws Exception {
        String id = submitted("ENR-2026-0005");

        mockMvc.perform(
                        post("/enrollment-applications/{id}/submit", id)
                                .header("Idempotency-Key", KEY)
                                .with(asCreator()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("STATE_CONFLICT"));
    }

    @Test
    void refusesToDecideAnApplicationThatWasNeverTakenUnderReview() throws Exception {
        // Propriété centrale : la machine à états normative n'offre aucun chemin
        // SUBMITTED -> APPROVED. Le contrôle est donc un PRÉREQUIS de la décision, ce qui
        // donne sa portée réelle à la séparation ENROLLMENT.REVIEW / ENROLLMENT.APPROVE.
        String id = submitted("ENR-2026-0006");

        mockMvc.perform(
                        post("/enrollment-applications/{id}/approve", id)
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}")
                                .with(asApprover()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("STATE_CONFLICT"));

        // Une transition refusée ne laisse aucun effet de bord.
        Assertions.assertEquals(
                0L,
                count("SELECT count(*) FROM enrollment.enrollment_decision WHERE case_id = ?::uuid", id));
        Assertions.assertEquals(0L, auditCount(id, "ENROLLMENT_CASE.APPROVED"));
    }

    @Test
    void startsReviewAssignsTheCaseAndAuditsIt() throws Exception {
        String id = submitted("ENR-2026-0007");

        mockMvc.perform(post("/enrollment-applications/{id}/start-review", id).with(asReviewer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UNDER_REVIEW"))
                .andExpect(jsonPath("$.assignedTo").value(ACTOR));

        Assertions.assertEquals(1L, auditCount(id, "ENROLLMENT_CASE.REVIEW_STARTED"));
    }

    @Test
    void requestsAComplementRecordsTheReviewAndAuditsIt() throws Exception {
        String id = underReview("ENR-2026-0008");

        mockMvc.perform(
                        post("/enrollment-applications/{id}/request-complement", id)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"comment\": \"RCCM illisible, merci de renvoyer\" }")
                                .with(asReviewer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLEMENT_REQUIRED"));

        Assertions.assertEquals(
                1L,
                count(
                        "SELECT count(*) FROM enrollment.enrollment_review "
                                + "WHERE case_id = ?::uuid AND result = 'COMPLEMENT_REQUIRED' "
                                + "AND created_by = ?::uuid",
                        id,
                        ACTOR));
        Assertions.assertEquals(1L, auditCount(id, "ENROLLMENT_CASE.COMPLEMENT_REQUESTED"));
    }

    @Test
    void returnsToReviewWhenTheComplementIsProvided() throws Exception {
        String id = underReview("ENR-2026-0009");
        mockMvc.perform(
                        post("/enrollment-applications/{id}/request-complement", id)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"comment\": \"pièce manquante\" }")
                                .with(asReviewer()))
                .andExpect(status().isOk());

        // La source prescrit COMPLEMENT_REQUIRED -> UNDER_REVIEW : le complément fourni
        // renvoie le dossier au contrôle, pas à l'état soumis.
        mockMvc.perform(
                        post("/enrollment-applications/{id}/submit", id)
                                .header("Idempotency-Key", KEY)
                                .with(asCreator()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UNDER_REVIEW"));
    }

    @Test
    void approvesAnApplicationAndRecordsANamedDecision() throws Exception {
        String id = underReview("ENR-2026-0010");

        mockMvc.perform(
                        post("/enrollment-applications/{id}/approve", id)
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"comment\": \"Dossier complet\" }")
                                .with(asApprover()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        Assertions.assertEquals(
                ACTOR,
                jdbcTemplate.queryForObject(
                        "SELECT decided_by::text FROM enrollment.enrollment_decision "
                                + "WHERE case_id = ?::uuid AND decision = 'APPROVED'",
                        String.class,
                        id));
        Assertions.assertEquals(1L, auditCount(id, "ENROLLMENT_CASE.APPROVED"));
    }

    @Test
    void rejectsAnApplicationWithAReasonAndAuditsIt() throws Exception {
        String id = underReview("ENR-2026-0011");

        mockMvc.perform(
                        post("/enrollment-applications/{id}/reject", id)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"reasonCode\": \"HORS_PERIMETRE\", \"comment\": \"Non éligible\" }")
                                .with(asApprover()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        Assertions.assertEquals(
                1L,
                count(
                        "SELECT count(*) FROM enrollment.enrollment_decision "
                                + "WHERE case_id = ?::uuid AND decision = 'REJECTED' "
                                + "AND reason_code = 'HORS_PERIMETRE'",
                        id));
        Assertions.assertEquals(1L, auditCount(id, "ENROLLMENT_CASE.REJECTED"));
    }

    @Test
    void refusesARejectionWithoutAMotive() throws Exception {
        // Une décision défavorable non motivée n'est pas opposable au demandeur.
        String id = underReview("ENR-2026-0012");

        mockMvc.perform(
                        post("/enrollment-applications/{id}/reject", id)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"reasonCode\": \"HORS_PERIMETRE\" }")
                                .with(asApprover()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void refusesAnyTransitionOutOfATerminalState() throws Exception {
        String id = underReview("ENR-2026-0013");
        mockMvc.perform(
                        post("/enrollment-applications/{id}/approve", id)
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}")
                                .with(asApprover()))
                .andExpect(status().isOk());

        mockMvc.perform(
                        post("/enrollment-applications/{id}/reject", id)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"comment\": \"trop tard\" }")
                                .with(asApprover()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("STATE_CONFLICT"));
    }

    @Test
    void deniesApprovalToAReviewerWithoutTheApprovePermission() throws Exception {
        String id = underReview("ENR-2026-0014");

        mockMvc.perform(
                        post("/enrollment-applications/{id}/approve", id)
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}")
                                .with(asReviewer()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void deniesReviewActionsToACreator() throws Exception {
        String id = submitted("ENR-2026-0015");

        mockMvc.perform(post("/enrollment-applications/{id}/start-review", id).with(asCreator()))
                .andExpect(status().isForbidden());
    }

    @Test
    void deniesComplementRequestToAnApproverWithoutTheReviewPermission() throws Exception {
        String id = underReview("ENR-2026-0016");

        mockMvc.perform(
                        post("/enrollment-applications/{id}/request-complement", id)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{ \"comment\": \"x\" }")
                                .with(asApprover()))
                .andExpect(status().isForbidden());
    }

    @Test
    void refusesADecisionFromAnUnidentifiableActor() throws Exception {
        String id = underReview("ENR-2026-0017");

        mockMvc.perform(
                        post("/enrollment-applications/{id}/approve", id)
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}")
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("PERM_ENROLLMENT.APPROVE"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void refusesASubmissionFromAnUnidentifiableActor() throws Exception {
        // La garde d'imputabilité couvre TOUTE transition, pas seulement les décisions.
        String id = createCase("ENR-2026-0018");

        mockMvc.perform(
                        post("/enrollment-applications/{id}/submit", id)
                                .header("Idempotency-Key", KEY)
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("PERM_ENROLLMENT.CREATE"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void requiresTheIdempotencyKeyOnSubmitAndApprove() throws Exception {
        String id = submitted("ENR-2026-0019");

        // Le contrat déclare l'en-tête obligatoire sur ces deux opérations.
        mockMvc.perform(post("/enrollment-applications/{id}/submit", id).with(asCreator()))
                .andExpect(status().isBadRequest());
        mockMvc.perform(
                        post("/enrollment-applications/{id}/approve", id)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}")
                                .with(asApprover()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returnsNotFoundForAnUnknownApplication() throws Exception {
        mockMvc.perform(
                        get("/enrollment-applications/{id}", "12345678-0000-0000-0000-0000000000ff")
                                .with(asCreator()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    void rejectsAnonymousAccess() throws Exception {
        mockMvc.perform(
                        post("/enrollment-applications")
                                .header("Idempotency-Key", KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("ENR-2026-0020", ORG_ID)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requiresTheIdempotencyKeyOnCreation() throws Exception {
        mockMvc.perform(
                        post("/enrollment-applications")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("ENR-2026-0021", ORG_ID))
                                .with(asCreator()))
                .andExpect(status().isBadRequest());
    }

    @TestConfiguration
    static class JwtDecoderStub {
        @Bean
        JwtDecoder jwtDecoder() {
            return token -> Jwt.withTokenValue(token).header("alg", "none").subject("test").build();
        }
    }
}
