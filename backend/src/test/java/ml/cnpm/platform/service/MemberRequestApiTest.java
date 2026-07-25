package ml.cnpm.platform.service;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
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
 * Espace membre — requêtes et réclamations, de bout en bout.
 *
 * <p>Trois propriétés sont défendues. Le PÉRIMÈTRE : un cotisant ne voit et n'écrit que sur les
 * requêtes de SON organisation. L'IDEMPOTENCE : rejouer la même création ne produit pas de
 * doublon. La SOUVERAINETÉ : une note interne de la CNPM ne franchit jamais la frontière du
 * membre.
 *
 * <p>Aucune donnée réelle : organisations, adhésions et échanges sont fictifs.
 */
@SpringBootTest
@Testcontainers
class MemberRequestApiTest {

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

        UUID alpha = seedMembership("Requête Alpha", "REQ-0001");
        UUID beta = seedMembership("Requête Beta", "REQ-0002");
        alphaAccount = seedMemberAccount("req-alpha@portal.test", alpha);
        betaAccount = seedMemberAccount("req-beta@portal.test", beta);
        professionalAccount =
                jdbcTemplate.queryForObject(
                        "INSERT INTO iam.user_account (email, display_name, account_type)"
                                + " VALUES ('req-agent@portal.test', 'Agent', 'PROFESSIONAL')"
                                + " RETURNING id",
                        UUID.class);
    }

    private UUID seedMembership(String legalName, String number) {
        UUID organization =
                jdbcTemplate.queryForObject(
                        "INSERT INTO member.organization (legal_name, organization_type)"
                                + " VALUES (?, 'ENTREPRISE') RETURNING id",
                        UUID.class,
                        legalName);
        jdbcTemplate.update(
                "INSERT INTO member.membership (organization_id, membership_number, category_code)"
                        + " VALUES (?, ?, 'ENTREPRISE')",
                organization,
                number);
        return organization;
    }

    private UUID seedMemberAccount(String email, UUID organization) {
        UUID membership =
                jdbcTemplate.queryForObject(
                        "SELECT id FROM member.membership WHERE organization_id = ?",
                        UUID.class,
                        organization);
        return jdbcTemplate.queryForObject(
                "INSERT INTO iam.user_account (email, display_name, account_type, member_id)"
                        + " VALUES (?, 'Membre de test', 'MEMBER', ?) RETURNING id",
                UUID.class,
                email,
                membership);
    }

    private static RequestPostProcessor asMember(UUID accountId) {
        return jwt().jwt(builder -> builder.subject(accountId.toString()))
                .authorities(
                        new SimpleGrantedAuthority("PERM_REQUEST.READ"),
                        new SimpleGrantedAuthority("PERM_REQUEST.WRITE"));
    }

    @Test
    @DisplayName("crée une requête idempotente, la liste, y répond et masque les notes internes")
    void fullMemberRequestLifecycle() throws Exception {
        String key = "req-key-alpha-000001";
        String body =
                "{\"type\":\"INFORMATION\",\"subject\":\"Attestation de cotisation\","
                        + "\"description\":\"Bonjour, je souhaite une attestation à jour.\"}";

        // Création.
        String created =
                mockMvc
                        .perform(
                                post("/portal/requests")
                                        .with(asMember(alphaAccount))
                                        .header("Idempotency-Key", key)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(body))
                        .andExpect(status().isCreated())
                        .andExpect(
                                jsonPath("$.reference")
                                        .value(org.hamcrest.Matchers.matchesPattern("CNPM-REQ-\\d{6}")))
                        .andExpect(jsonPath("$.status").value("SUBMITTED"))
                        .andExpect(jsonPath("$.type").value("INFORMATION"))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        UUID requestId = UUID.fromString(com.jayway.jsonpath.JsonPath.read(created, "$.id"));
        String reference = com.jayway.jsonpath.JsonPath.read(created, "$.reference");

        // Rejeu idempotent : même clé → même requête, aucun doublon.
        mockMvc
                .perform(
                        post("/portal/requests")
                                .with(asMember(alphaAccount))
                                .header("Idempotency-Key", key)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(requestId.toString()));

        Long count =
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM service.request WHERE idempotency_key = ?",
                        Long.class,
                        key);
        org.junit.jupiter.api.Assertions.assertEquals(1L, count);

        // Note INTERNE de la CNPM : elle ne doit jamais apparaître au membre.
        jdbcTemplate.update(
                "INSERT INTO service.request_message (request_id, sender_type, body, visibility)"
                        + " VALUES (?, 'AGENT', 'Note interne : à vérifier.', 'INTERNAL')",
                requestId);

        // Réponse du membre.
        mockMvc
                .perform(
                        post("/portal/requests/" + requestId + "/messages")
                                .with(asMember(alphaAccount))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"body\":\"Merci, c’est urgent.\"}"))
                .andExpect(status().isCreated())
                // Seul l'échange partagé du membre est visible, pas la note interne.
                .andExpect(jsonPath("$.conversation", hasSize(1)))
                .andExpect(jsonPath("$.conversation[0].sender").value("MEMBER"))
                .andExpect(jsonPath("$.conversation[0].body").value("Merci, c’est urgent."));

        // Liste bornée à l'organisation d'Alpha.
        mockMvc
                .perform(get("/portal/requests").with(asMember(alphaAccount)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].reference").value(reference))
                .andExpect(jsonPath("$.items[0].id").value(requestId.toString()));
    }

    @Test
    @DisplayName("ne fait jamais fuir la requête d’un autre cotisant")
    void neverLeaksAnotherMembersRequest() throws Exception {
        // Beta crée sa requête ; Alpha ne doit pas la voir, et inversement.
        mockMvc
                .perform(
                        post("/portal/requests")
                                .with(asMember(betaAccount))
                                .header("Idempotency-Key", "req-key-beta-000001")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"type\":\"CLAIM\",\"subject\":\"Réclamation Beta\","
                                                + "\"description\":\"Contenu Beta.\"}"))
                .andExpect(status().isCreated());

        mockMvc
                .perform(get("/portal/requests").with(asMember(betaAccount)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].subject").value("Réclamation Beta"));
    }

    @Test
    @DisplayName("refuse la liste d’un compte sans adhésion")
    void refusesRequestsForAccountWithoutMembership() throws Exception {
        mockMvc
                .perform(get("/portal/requests").with(asMember(professionalAccount)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("rejette un type de requête hors périmètre membre")
    void rejectsUnknownRequestType() throws Exception {
        mockMvc
                .perform(
                        post("/portal/requests")
                                .with(asMember(alphaAccount))
                                .header("Idempotency-Key", "req-key-alpha-badtype01")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"type\":\"INTERNAL_ADMIN\",\"subject\":\"X\","
                                                + "\"description\":\"Y\"}"))
                .andExpect(status().is4xxClientError());
    }
}
