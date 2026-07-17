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
 * Test de bout en bout du module MEMBER — {@code listOrganizations}.
 *
 * <p>Il valide la chaîne complète — filtres dynamiques, recherche, tri borné,
 * pagination, autorisation par permission — sur des entreprises synthétiques insérées
 * par le test (aucune donnée réelle de membre, {@code CLAUDE.md}). L'autorisation
 * s'appuie sur la permission {@code MEMBER.READ} ; un rôle qui ne la porte pas obtient
 * un 403.
 */
@SpringBootTest
@Testcontainers
class OrganizationApiTest {

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
        // État déterministe par test : entreprises synthétiques (organization n'est pas
        // append-only, on peut donc la réinitialiser).
        jdbcTemplate.update("DELETE FROM member.organization");
        insert("Alpha SA", "GRANDE_ENTREPRISE", "AGRI", "ACTIVE");
        insert("Beta SARL", "PME", "BTP", "ACTIVE");
        insert("Gamma SARL", "PME", "BTP", "DORMANT");
        insert("Delta TPE", "TPE", "SERVICES", "PROSPECT");
        insert("Epsilon SA", "GRANDE_ENTREPRISE", "AGRI", "ACTIVE");
    }

    private void insert(String legalName, String type, String sector, String status) {
        jdbcTemplate.update(
                "INSERT INTO member.organization (id, legal_name, organization_type, sector_code, status, risk_level) "
                        + "VALUES (gen_random_uuid(), ?, ?, ?, ?, 'NORMAL')",
                legalName,
                type,
                sector,
                status);
    }

    private static RequestPostProcessor asMemberReader() {
        return jwt().authorities(new SimpleGrantedAuthority("PERM_MEMBER.READ"));
    }

    @Test
    void listsOrganizationsSortedByLegalNameByDefault() throws Exception {
        mockMvc.perform(get("/organizations").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.items[0].legalName").value("Alpha SA"))
                .andExpect(jsonPath("$.items[4].legalName").value("Gamma SARL"))
                .andExpect(jsonPath("$.items[0].version").exists());
    }

    @Test
    void filtersByStatus() throws Exception {
        mockMvc.perform(get("/organizations").param("status", "ACTIVE").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    void filtersByOrganizationType() throws Exception {
        mockMvc.perform(
                        get("/organizations").param("organizationType", "PME").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void searchesByName() throws Exception {
        mockMvc.perform(get("/organizations").param("search", "sarl").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.items[0].legalName").value("Beta SARL"));
    }

    @Test
    void sortsDescending() throws Exception {
        mockMvc.perform(
                        get("/organizations").param("sort", "legalName,desc").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].legalName").value("Gamma SARL"));
    }

    @Test
    void paginatesWithAStableOrder() throws Exception {
        mockMvc.perform(
                        get("/organizations")
                                .param("page", "0")
                                .param("size", "2")
                                .with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.items[0].legalName").value("Alpha SA"))
                .andExpect(jsonPath("$.items[1].legalName").value("Beta SARL"));

        mockMvc.perform(
                        get("/organizations")
                                .param("page", "1")
                                .param("size", "2")
                                .with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].legalName").value("Delta TPE"))
                .andExpect(jsonPath("$.items[1].legalName").value("Epsilon SA"));
    }

    @Test
    void filtersBySectorCode() throws Exception {
        mockMvc.perform(get("/organizations").param("sectorCode", "AGRI").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void sortsByStatus() throws Exception {
        // Tri autorisé distinct de legalName : ACTIVE avant DORMANT avant PROSPECT.
        mockMvc.perform(get("/organizations").param("sort", "status,asc").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.items[4].status").value("PROSPECT"));
    }

    @Test
    void fallsBackToTheDefaultOrderForAnUnauthorizedSortKey() throws Exception {
        // Une clé de tri hors liste blanche ne doit ni échouer ni trier par ce champ :
        // repli sur l'ordre par défaut (raison sociale). Protège contre l'injection par
        // nom de propriété.
        mockMvc.perform(
                        get("/organizations").param("sort", "riskLevel,desc").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].legalName").value("Alpha SA"));
    }

    @Test
    void returnsAnEmptyPageWhenNothingMatches() throws Exception {
        mockMvc.perform(
                        get("/organizations").param("search", "introuvable-xyz").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void treatsSearchMetacharactersLiterally() throws Exception {
        // Aucune raison sociale ne contient « _ » : un joker non échappé ramènerait des
        // résultats. La recherche doit traiter « _ » à la lettre.
        mockMvc.perform(get("/organizations").param("search", "_").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void acceptsTheExactMaximumPageSize() throws Exception {
        mockMvc.perform(get("/organizations").param("size", "100").with(asMemberReader()))
                .andExpect(status().isOk());
    }

    @Test
    void rejectsAPageSizeBeyondTheServerBound() throws Exception {
        mockMvc.perform(get("/organizations").param("size", "500").with(asMemberReader()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deniesAccessWithoutTheMemberReadPermission() throws Exception {
        // Rôle authentifié mais dépourvu de PERM_MEMBER.READ : 403, jamais 200.
        mockMvc.perform(
                        get("/organizations")
                                .with(
                                        jwt().authorities(
                                                new SimpleGrantedAuthority("ROLE_MEMBRE_UTILISATEUR"))))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void rejectsAnonymousAccess() throws Exception {
        mockMvc.perform(get("/organizations")).andExpect(status().isUnauthorized());
    }

    @TestConfiguration
    static class JwtDecoderStub {
        @Bean
        JwtDecoder jwtDecoder() {
            return token -> Jwt.withTokenValue(token).header("alg", "none").subject("test").build();
        }
    }
}
