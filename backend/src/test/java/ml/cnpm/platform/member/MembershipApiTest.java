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
        // Le rattachement entreprise-groupement dépend de l'entreprise (FK ON DELETE
        // CASCADE) ; on le vide explicitement avant les entreprises. Les groupements de
        // référence (member.professional_group) sont semés par V6 et conservés : les
        // rattachements pointent vers des groupements RÉELS via leur code.
        jdbcTemplate.update("DELETE FROM member.group_membership");
        jdbcTemplate.update("DELETE FROM member.membership");
        jdbcTemplate.update("DELETE FROM member.organization");
        // Identifiants d'adhésion explicites et ordonnés : rendent le départage par id
        // (tie-breaker) déterministe, donc réellement observable.
        insert("0001", "Alpha SA", "CNPM-2024-0001", "GE", "ACTIVE");
        insert("0002", "Beta SARL", "CNPM-2024-0002", "PME", "ACTIVE");
        insert("0003", "Gamma SARL", "CNPM-2024-0003", "PME", "DORMANT");
        insert("0004", "Delta TPE", "CNPM-2024-0004", "TPE", "PROSPECT");
        // Alpha appartient au GPP (pétroliers), Beta au CNOM (opérateurs miniers).
        attachPrimaryGroup("0001", "GPP", "2024-01-15", null);
        attachPrimaryGroup("0002", "CNOM", "2024-01-15", null);
        // Gamma n'a aucun groupement → groupement principal null.
        // Delta n'a qu'un rattachement CLÔTURÉ (left_at non nul) → groupement principal null.
        attachPrimaryGroup("0004", "OPI", "2020-01-01", "2022-12-31");
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

    /** Rattache l'entreprise (par suffixe d'id) au groupement de code donné, comme principal. */
    private void attachPrimaryGroup(String orgSuffix, String groupCode, String joinedAt, String leftAt) {
        String orgId = "11111111-0000-0000-0000-00000000" + orgSuffix;
        jdbcTemplate.update(
                "INSERT INTO member.group_membership "
                        + "(organization_id, group_id, is_primary, joined_at, left_at) "
                        + "SELECT ?::uuid, id, true, ?::date, ?::date "
                        + "FROM member.professional_group WHERE code = ?",
                orgId,
                joinedAt,
                leftAt,
                groupCode);
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

    @Test
    void exposesThePrimaryProfessionalGroup() throws Exception {
        // Alpha (numéro le plus bas → première ligne par défaut) est rattachée au GPP.
        mockMvc.perform(get("/memberships").param("search", "alpha").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].membershipNumber").value("CNPM-2024-0001"))
                .andExpect(jsonPath("$.items[0].primaryGroupCode").value("GPP"))
                .andExpect(
                        jsonPath("$.items[0].primaryGroupName")
                                .value("Groupement Professionnel des Pétroliers du Mali"));
    }

    @Test
    void leavesThePrimaryGroupNullWhenTheOrganizationHasNone() throws Exception {
        // Gamma n'a aucun rattachement.
        mockMvc.perform(get("/memberships").param("search", "gamma").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].membershipNumber").value("CNPM-2024-0003"))
                .andExpect(jsonPath("$.items[0].primaryGroupCode").value(nullValue()))
                .andExpect(jsonPath("$.items[0].primaryGroupName").value(nullValue()));
    }

    @Test
    void ignoresAClosedPrimaryGroup() throws Exception {
        // Delta n'a qu'un rattachement clôturé (left_at non nul) → aucun groupement actif.
        mockMvc.perform(get("/memberships").param("search", "delta").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].membershipNumber").value("CNPM-2024-0004"))
                .andExpect(jsonPath("$.items[0].primaryGroupCode").value(nullValue()));
    }

    @Test
    void filtersByGroupCode() throws Exception {
        mockMvc.perform(get("/memberships").param("groupCode", "GPP").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].organizationLegalName").value("Alpha SA"));
    }

    @Test
    void sortsByPrimaryGroupNameNullsLast() throws Exception {
        // Ascendant : CNOM ("Conseil…") avant GPP ("Groupement…"), les null (Gamma, Delta)
        // en fin (NULLS LAST par défaut en PostgreSQL).
        mockMvc.perform(
                        get("/memberships")
                                .param("sort", "primaryGroupName,asc")
                                .with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].primaryGroupCode").value("CNOM"))
                .andExpect(jsonPath("$.items[1].primaryGroupCode").value("GPP"));
    }

    @Test
    void ignoresANonPrimaryGroupMembership() throws Exception {
        // Epsilon n'a qu'un rattachement ACTIF mais NON principal (is_primary=false) : il
        // ne doit jamais devenir le groupement principal. Cible la condition AND gm.is_primary
        // de la vue, distincte de la condition left_at IS NULL déjà couverte.
        String orgId = "11111111-0000-0000-0000-000000008888";
        String membershipId = "22222222-0000-0000-0000-000000008888";
        jdbcTemplate.update(
                "INSERT INTO member.organization (id, legal_name, organization_type, status, risk_level) "
                        + "VALUES (?::uuid, 'Epsilon SA', 'GRANDE_ENTREPRISE', 'ACTIVE', 'NORMAL')",
                orgId);
        jdbcTemplate.update(
                "INSERT INTO member.membership (id, organization_id, membership_number, category_code, status, joined_at) "
                        + "VALUES (?::uuid, ?::uuid, 'CNPM-2024-8888', 'GE', 'ACTIVE', DATE '2024-01-15')",
                membershipId,
                orgId);
        jdbcTemplate.update(
                "INSERT INTO member.group_membership (organization_id, group_id, is_primary, joined_at) "
                        + "SELECT ?::uuid, id, false, DATE '2024-01-15' "
                        + "FROM member.professional_group WHERE code = 'OPI'",
                orgId);

        mockMvc.perform(get("/memberships").param("search", "epsilon").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].membershipNumber").value("CNPM-2024-8888"))
                .andExpect(jsonPath("$.items[0].primaryGroupCode").value(nullValue()));
    }

    @Test
    void filtersByGroupCodeReturnsNoResultWhenNoOrganizationMatches() throws Exception {
        // AEPES est un groupement réel (V6) mais rattaché à aucune entreprise du jeu :
        // contrôle négatif du filtre groupCode (0 résultat), sans code inventé.
        mockMvc.perform(get("/memberships").param("groupCode", "AEPES").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void returnsASingleRowWhenTwoPrimaryGroupsShareTheJoinDate() throws Exception {
        // Deux is_primary=true de MÊME joined_at (aucune contrainte ne l'interdit) : la vue
        // ne doit JAMAIS dupliquer l'adhésion dans la liste (LIMIT 1). Le groupement retenu
        // dépend du départage par group_id (UUID aléatoire des seeds) et n'est donc pas
        // asserté ; la propriété de sûreté testée ici est l'unicité de ligne.
        String orgId = "11111111-0000-0000-0000-000000007777";
        String membershipId = "22222222-0000-0000-0000-000000007777";
        jdbcTemplate.update(
                "INSERT INTO member.organization (id, legal_name, organization_type, status, risk_level) "
                        + "VALUES (?::uuid, 'Zeta SA', 'GRANDE_ENTREPRISE', 'ACTIVE', 'NORMAL')",
                orgId);
        jdbcTemplate.update(
                "INSERT INTO member.membership (id, organization_id, membership_number, category_code, status, joined_at) "
                        + "VALUES (?::uuid, ?::uuid, 'CNPM-2024-7777', 'GE', 'ACTIVE', DATE '2024-01-15')",
                membershipId,
                orgId);
        attachPrimaryGroup("7777", "GPP", "2024-03-01", null);
        attachPrimaryGroup("7777", "CNOM", "2024-03-01", null);

        mockMvc.perform(get("/memberships").param("search", "zeta").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(
                        jsonPath("$.items[0].primaryGroupCode")
                                .value(
                                        org.hamcrest.Matchers.anyOf(
                                                org.hamcrest.Matchers.is("GPP"),
                                                org.hamcrest.Matchers.is("CNOM"))));
    }

    @Test
    void rejectsAGroupCodeBeyondTheServerBound() throws Exception {
        // groupCode > 60 caractères : rejet 400 normalisé (contrôle de forme au bord).
        mockMvc.perform(
                        get("/memberships")
                                .param("groupCode", "X".repeat(61))
                                .with(asMemberReader()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resolvesTheMostRecentPrimaryGroupDeterministically() throws Exception {
        // Aucune contrainte n'interdit deux is_primary : la vue retient le plus récent
        // (joined_at décroissant). Une entreprise dédiée porte deux rattachements
        // principaux ; OPI (2024-06-01) doit l'emporter sur GPP (2024-01-01).
        String orgId = "11111111-0000-0000-0000-000000009999";
        String membershipId = "22222222-0000-0000-0000-000000009999";
        jdbcTemplate.update(
                "INSERT INTO member.organization (id, legal_name, organization_type, status, risk_level) "
                        + "VALUES (?::uuid, 'Omega SA', 'GRANDE_ENTREPRISE', 'ACTIVE', 'NORMAL')",
                orgId);
        jdbcTemplate.update(
                "INSERT INTO member.membership (id, organization_id, membership_number, category_code, status, joined_at) "
                        + "VALUES (?::uuid, ?::uuid, 'CNPM-2024-9999', 'GE', 'ACTIVE', DATE '2024-01-15')",
                membershipId,
                orgId);
        attachPrimaryGroup("9999", "GPP", "2024-01-01", null);
        attachPrimaryGroup("9999", "OPI", "2024-06-01", null);

        mockMvc.perform(get("/memberships").param("search", "omega").with(asMemberReader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].primaryGroupCode").value("OPI"));
    }

    @TestConfiguration
    static class JwtDecoderStub {
        @Bean
        JwtDecoder jwtDecoder() {
            return token -> Jwt.withTokenValue(token).header("alg", "none").subject("test").build();
        }
    }
}
