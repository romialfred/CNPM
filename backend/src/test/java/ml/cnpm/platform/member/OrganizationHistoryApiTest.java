package ml.cnpm.platform.member;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
 * Test de bout en bout de {@code getOrganizationHistory} — l'action « Historique » de BO-002.
 *
 * <p>La table {@code member.membership_status_history} est append-only (triggers V4/V5) : on
 * ne peut ni la vider ni supprimer une adhésion qui la référence. Chaque test emploie donc
 * des identifiants d'entreprise DISTINCTS et n'interroge que sa propre entreprise ;
 * l'endpoint filtrant par {@code organization_id}, les données des autres tests n'interfèrent
 * pas. Aucune donnée réelle de membre.
 */
@SpringBootTest
@Testcontainers
class OrganizationHistoryApiTest {

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

    @BeforeEach
    void setUp() {
        this.mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(correlationIdFilter)
                        .apply(springSecurity())
                        .build();
    }

    private void insertOrganization(String orgId, String legalName) {
        jdbcTemplate.update(
                "INSERT INTO member.organization (id, legal_name, organization_type, status, risk_level) "
                        + "VALUES (?::uuid, ?, 'GRANDE_ENTREPRISE', 'ACTIVE', 'NORMAL')",
                orgId,
                legalName);
    }

    private void insertMembership(String membershipId, String orgId, String number) {
        jdbcTemplate.update(
                "INSERT INTO member.membership (id, organization_id, membership_number, category_code, status) "
                        + "VALUES (?::uuid, ?::uuid, ?, 'GE', 'ACTIVE')",
                membershipId,
                orgId,
                number);
    }

    private void insertHistory(
            String id,
            String membershipId,
            String fromStatus,
            String toStatus,
            String reason,
            String createdAt,
            String createdBy) {
        jdbcTemplate.update(
                "INSERT INTO member.membership_status_history "
                        + "(id, membership_id, from_status, to_status, reason, created_at, created_by) "
                        + "VALUES (?::uuid, ?::uuid, ?, ?, ?, ?::timestamptz, ?::uuid)",
                id,
                membershipId,
                fromStatus,
                toStatus,
                reason,
                createdAt,
                createdBy);
    }

    private static RequestPostProcessor asMemberReader() {
        return jwt().authorities(new SimpleGrantedAuthority("PERM_MEMBER.READ"));
    }

    @Test
    void listsStatusHistoryMostRecentFirst() throws Exception {
        String orgId = "55555555-0000-0000-0000-000000000001";
        String membershipId = "66666666-0000-0000-0000-000000000001";
        String actor = "77777777-0000-0000-0000-000000000001";
        insertOrganization(orgId, "Alpha SA");
        insertMembership(membershipId, orgId, "CNPM-2024-0001");
        insertHistory("88888888-0000-0000-0000-000000000001", membershipId, null, "PROSPECT",
                "Création", "2024-01-01T10:00:00Z", actor);
        insertHistory("88888888-0000-0000-0000-000000000002", membershipId, "PROSPECT", "ACTIVE",
                "Validation", "2024-02-01T10:00:00Z", actor);
        insertHistory("88888888-0000-0000-0000-000000000003", membershipId, "ACTIVE", "DORMANT",
                null, "2024-03-01T10:00:00Z", null);

        mockMvc.perform(get("/organizations/{id}/history", orgId).with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                // Plus récent en tête.
                .andExpect(jsonPath("$.items[0].toStatus").value("DORMANT"))
                .andExpect(jsonPath("$.items[0].fromStatus").value("ACTIVE"))
                .andExpect(jsonPath("$.items[0].membershipNumber").value("CNPM-2024-0001"))
                .andExpect(jsonPath("$.items[0].reason").value(nullValue()))
                .andExpect(jsonPath("$.items[0].changedBy").value(nullValue()))
                .andExpect(jsonPath("$.items[2].toStatus").value("PROSPECT"))
                // Statut initial : pas de statut précédent.
                .andExpect(jsonPath("$.items[2].fromStatus").value(nullValue()))
                .andExpect(jsonPath("$.items[2].changedBy").value(actor));
    }

    @Test
    void returnsEmptyHistoryForAnOrganizationWithoutChanges() throws Exception {
        String orgId = "55555555-0000-0000-0000-000000000002";
        insertOrganization(orgId, "Beta SARL");

        mockMvc.perform(get("/organizations/{id}/history", orgId).with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.items").isEmpty());
    }

    @Test
    void returnsNotFoundForAnUnknownOrganization() throws Exception {
        mockMvc.perform(
                        get("/organizations/{id}/history", "55555555-0000-0000-0000-0000000000ff")
                                .with(asMemberReader()))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    void paginatesHistoryWithAStableOrder() throws Exception {
        String orgId = "55555555-0000-0000-0000-000000000003";
        String membershipId = "66666666-0000-0000-0000-000000000003";
        insertOrganization(orgId, "Gamma SARL");
        insertMembership(membershipId, orgId, "CNPM-2024-0003");
        for (int i = 1; i <= 4; i++) {
            insertHistory(
                    "99999999-0000-0000-0000-00000000000" + i,
                    membershipId,
                    "ACTIVE",
                    "DORMANT",
                    "chg" + i,
                    "2024-0" + i + "-01T10:00:00Z",
                    null);
        }

        mockMvc.perform(
                        get("/organizations/{id}/history", orgId)
                                .param("page", "0")
                                .param("size", "2")
                                .with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.totalPages").value(2))
                // Page 0 = les deux plus récents (avril, mars).
                .andExpect(jsonPath("$.items[0].reason").value("chg4"))
                .andExpect(jsonPath("$.items[1].reason").value("chg3"));
    }

    @Test
    void keepsPagesDisjointWhenTwoChangesShareTheTimestamp() throws Exception {
        // created_at DEFAULT now() = horodatage de DÉBUT de transaction : deux transitions
        // écrites dans la même transaction (ou une correction/migration par lot) partagent
        // l'instant. Le départage par id (croissant) doit alors rendre la pagination stable —
        // aucune ligne dupliquée ni omise entre pages. Sans ce départage, l'ordre de deux
        // lignes de même horodatage serait indéterminé et ce test deviendrait instable.
        String orgId = "55555555-0000-0000-0000-000000000007";
        String membershipId = "66666666-0000-0000-0000-000000000007";
        insertOrganization(orgId, "Delta SA");
        insertMembership(membershipId, orgId, "CNPM-2024-0007");
        String sameInstant = "2024-05-01T10:00:00Z";
        String idA = "aaaaaaaa-0000-0000-0000-000000000001";
        String idB = "aaaaaaaa-0000-0000-0000-000000000002";
        insertHistory(idA, membershipId, "ACTIVE", "DORMANT", "instant-A", sameInstant, null);
        insertHistory(idB, membershipId, "ACTIVE", "DORMANT", "instant-B", sameInstant, null);

        // À created_at égal, le tri secondaire id croissant place A (…01) avant B (…02) :
        // chaque ligne apparaît une seule fois, sur une seule page.
        mockMvc.perform(
                        get("/organizations/{id}/history", orgId)
                                .param("page", "0")
                                .param("size", "1")
                                .with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.items[0].id").value(idA))
                .andExpect(jsonPath("$.items[0].reason").value("instant-A"));
        mockMvc.perform(
                        get("/organizations/{id}/history", orgId)
                                .param("page", "1")
                                .param("size", "1")
                                .with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(idB))
                .andExpect(jsonPath("$.items[0].reason").value("instant-B"));
    }

    @Test
    void deniesAccessWithoutTheMemberReadPermission() throws Exception {
        mockMvc.perform(
                        get("/organizations/{id}/history", "55555555-0000-0000-0000-000000000004")
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("ROLE_MEMBRE_UTILISATEUR"))))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void rejectsAnonymousAccess() throws Exception {
        mockMvc.perform(get("/organizations/{id}/history", "55555555-0000-0000-0000-000000000005"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsAMalformedOrganizationIdentifier() throws Exception {
        mockMvc.perform(get("/organizations/{id}/history", "not-a-uuid").with(asMemberReader()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void rejectsAPageSizeBeyondTheServerBound() throws Exception {
        mockMvc.perform(
                        get("/organizations/{id}/history", "55555555-0000-0000-0000-000000000006")
                                .param("size", "500")
                                .with(asMemberReader()))
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
