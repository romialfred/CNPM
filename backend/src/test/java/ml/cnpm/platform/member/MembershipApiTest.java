package ml.cnpm.platform.member;

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
 * Test de bout en bout de {@code listMemberships} — la vue « membre » de BO-002.
 *
 * <p>Valide la jointure adhésion↔entreprise, les filtres, la recherche (sur le numéro
 * ET la raison sociale), le tri borné, la pagination et l'autorisation par permission,
 * sur des données synthétiques (aucune donnée réelle de membre).
 */
@SpringBootTest
@Testcontainers
class MembershipApiTest {

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
        jdbcTemplate.update("DELETE FROM member.membership");
        jdbcTemplate.update("DELETE FROM member.organization");
        // Identifiants d'adhésion explicites et ordonnés : rendent le départage par id
        // (tie-breaker) déterministe, donc réellement observable.
        insert("0001", "Alpha SA", "CNPM-2024-0001", "GE", "ACTIVE");
        insert("0002", "Beta SARL", "CNPM-2024-0002", "PME", "ACTIVE");
        insert("0003", "Gamma SARL", "CNPM-2024-0003", "PME", "DORMANT");
        insert("0004", "Delta TPE", "CNPM-2024-0004", "TPE", "PROSPECT");
    }

    private void insert(String suffix, String legalName, String number, String category, String status) {
        String orgId = "11111111-0000-0000-0000-00000000" + suffix;
        String membershipId = "22222222-0000-0000-0000-00000000" + suffix;
        jdbcTemplate.update(
                "INSERT INTO member.organization (id, legal_name, organization_type, status, risk_level) "
                        + "VALUES (?::uuid, ?, 'GRANDE_ENTREPRISE', 'ACTIVE', 'NORMAL')",
                orgId,
                legalName);
        jdbcTemplate.update(
                "INSERT INTO member.membership (id, organization_id, membership_number, category_code, status, joined_at) "
                        + "VALUES (?::uuid, ?::uuid, ?, ?, ?, DATE '2024-01-15')",
                membershipId,
                orgId,
                number,
                category,
                status);
    }

    private static RequestPostProcessor asMemberReader() {
        return jwt().authorities(new SimpleGrantedAuthority("PERM_MEMBER.READ"));
    }

    @Test
    void listsMembershipsJoinedToTheirOrganization() throws Exception {
        mockMvc.perform(get("/memberships").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.items[0].membershipNumber").value("CNPM-2024-0001"))
                // La jointure peuple bien la raison sociale de l'entreprise.
                .andExpect(jsonPath("$.items[0].organizationLegalName").value("Alpha SA"))
                .andExpect(jsonPath("$.items[0].categoryCode").value("GE"))
                .andExpect(jsonPath("$.items[0].version").exists());
    }

    @Test
    void filtersByStatus() throws Exception {
        mockMvc.perform(get("/memberships").param("status", "ACTIVE").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void filtersByCategory() throws Exception {
        mockMvc.perform(get("/memberships").param("categoryCode", "PME").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void searchesByOrganizationName() throws Exception {
        mockMvc.perform(get("/memberships").param("search", "beta").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].organizationLegalName").value("Beta SARL"));
    }

    @Test
    void searchesByMembershipNumber() throws Exception {
        mockMvc.perform(get("/memberships").param("search", "0003").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].membershipNumber").value("CNPM-2024-0003"));
    }

    @Test
    void treatsSearchMetacharactersLiterally() throws Exception {
        mockMvc.perform(get("/memberships").param("search", "_").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void sortsByOrganizationNameDescending() throws Exception {
        mockMvc.perform(
                        get("/memberships")
                                .param("sort", "organizationLegalName,desc")
                                .with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].organizationLegalName").value("Gamma SARL"));
    }

    @Test
    void sortsByMembershipNumberDescending() throws Exception {
        mockMvc.perform(
                        get("/memberships").param("sort", "membershipNumber,desc").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].membershipNumber").value("CNPM-2024-0004"))
                .andExpect(jsonPath("$.items[3].membershipNumber").value("CNPM-2024-0001"));
    }

    @Test
    void sortsByStatusWithAStableTieBreaker() throws Exception {
        // Deux adhésions ACTIVE : le départage par id (0001 avant 0002) rend leur ordre
        // déterministe. Sans le tie-breaker, cet ordre serait dépendant de la base.
        mockMvc.perform(get("/memberships").param("sort", "status,asc").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.items[0].membershipNumber").value("CNPM-2024-0001"))
                .andExpect(jsonPath("$.items[1].status").value("ACTIVE"))
                .andExpect(jsonPath("$.items[1].membershipNumber").value("CNPM-2024-0002"))
                .andExpect(jsonPath("$.items[3].status").value("PROSPECT"));
    }

    @Test
    void fallsBackToTheDefaultOrderForAnUnauthorizedSortKey() throws Exception {
        // Clé de tri hors liste blanche (chemin de propriété arbitraire) : repli
        // silencieux sur l'ordre par défaut, sans erreur ni tri par ce champ.
        mockMvc.perform(
                        get("/memberships").param("sort", "organizationId,desc").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].membershipNumber").value("CNPM-2024-0001"));
    }

    @Test
    void keepsPagesDisjointWhenSortingOnADuplicateKey() throws Exception {
        // Tri sur un champ à valeurs répétées (status), paginé : le départage garantit
        // que chaque adhésion apparaît sur une seule page, sans doublon ni omission.
        String p0 =
                mockMvc.perform(
                                get("/memberships")
                                        .param("sort", "status,asc")
                                        .param("size", "2")
                                        .param("page", "0")
                                        .with(asMemberReader()))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        String p1 =
                mockMvc.perform(
                                get("/memberships")
                                        .param("sort", "status,asc")
                                        .param("size", "2")
                                        .param("page", "1")
                                        .with(asMemberReader()))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        java.util.List<String> numbers = new java.util.ArrayList<>();
        numbers.addAll(com.jayway.jsonpath.JsonPath.read(p0, "$.items[*].membershipNumber"));
        numbers.addAll(com.jayway.jsonpath.JsonPath.read(p1, "$.items[*].membershipNumber"));
        // Quatre numéros distincts au total : aucune ligne dupliquée ni omise entre pages.
        org.junit.jupiter.api.Assertions.assertEquals(4, numbers.size());
        org.junit.jupiter.api.Assertions.assertEquals(4, new java.util.HashSet<>(numbers).size());
    }

    @Test
    void paginatesWithAStableOrder() throws Exception {
        mockMvc.perform(
                        get("/memberships").param("page", "0").param("size", "2").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.items[0].membershipNumber").value("CNPM-2024-0001"))
                .andExpect(jsonPath("$.items[1].membershipNumber").value("CNPM-2024-0002"));

        mockMvc.perform(
                        get("/memberships").param("page", "1").param("size", "2").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].membershipNumber").value("CNPM-2024-0003"));
    }

    @Test
    void deniesAccessWithoutTheMemberReadPermission() throws Exception {
        mockMvc.perform(
                        get("/memberships")
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("ROLE_MEMBRE_UTILISATEUR"))))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void rejectsAnonymousAccess() throws Exception {
        mockMvc.perform(get("/memberships")).andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsAPageSizeBeyondTheServerBound() throws Exception {
        mockMvc.perform(get("/memberships").param("size", "500").with(asMemberReader()))
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
