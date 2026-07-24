package ml.cnpm.platform.administration.application;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Assemble l'instantané « Administration et sécurité » à partir du schéma {@code iam}.
 *
 * <p>Lecture seule et strictement habilitée ({@code PERM_IAM.USER.READ}). Aucun secret n'est
 * lu ni renvoyé. La matrice des permissions est en lecture seule ici (les mutations relèvent
 * d'endpoints dédiés, non exposés par cette projection).
 */
@Service
public class AdminSecurityQueryService {

    private static final DateTimeFormatter LABEL =
            DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm", Locale.FRENCH);

    private final JdbcTemplate jdbc;

    AdminSecurityQueryService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @PreAuthorize("hasAuthority('PERM_IAM.USER.READ')")
    @Transactional(readOnly = true)
    public AdminSecurityView load() {
        List<AdminSecurityView.Account> accounts = accounts();
        List<AdminSecurityView.Role> roles = roles();
        List<AdminSecurityView.PermissionRow> permissions = permissions();

        int active = (int) accounts.stream().filter(a -> "ACTIVE".equals(a.status())).count();
        int suspended = (int) accounts.stream().filter(a -> "SUSPENDED".equals(a.status())).count();
        int twoFa = (int) accounts.stream().filter(a -> "ENABLED".equals(a.twoFactor())).count();

        AdminSecurityView.Posture posture = new AdminSecurityView.Posture(
                accounts.size(), active, suspended, twoFa, 0);
        AdminSecurityView.Counts counts = new AdminSecurityView.Counts(
                accounts.size(), roles.size(), permissions.size(), 0, 0);

        List<AdminSecurityView.PolicyItem> policy = List.of(
                new AdminSecurityView.PolicyItem("Second facteur", "Obligatoire pour les rôles sensibles"),
                new AdminSecurityView.PolicyItem("Sessions", "Jeton applicatif, expiration 8 h"),
                new AdminSecurityView.PolicyItem("Séparation des tâches", "Appliquée côté serveur (RBAC)"));

        return new AdminSecurityView(
                accounts, roles, permissions, List.of(), List.of(), policy, posture, counts,
                membersWithoutAccount(), false);
    }

    /**
     * Adhésions enregistrées sans compte utilisateur, pour amorcer un compte membre sans
     * ressaisir l'identité. La jointure sur {@code iam.user_account.member_id} garantit
     * qu'une adhésion déjà pourvue d'un compte n'y figure pas — sans quoi on pourrait créer
     * deux comptes pour la même adhésion.
     */
    private List<AdminSecurityView.MemberSummary> membersWithoutAccount() {
        return jdbc.query(
                "SELECT ml.id, ml.organization_legal_name, ml.membership_number, ml.category_code,"
                        + " rv.label AS category_label, ml.primary_group_name,"
                        + " ml.primary_contact_name, ml.primary_contact_email, ml.primary_contact_phone"
                        + " FROM member.membership_list ml"
                        + " LEFT JOIN iam.user_account ua ON ua.member_id = ml.id"
                        + " LEFT JOIN ref.reference_value rv"
                        + "   ON rv.domain = 'MEMBER_CATEGORY' AND rv.code = ml.category_code"
                        + " WHERE ua.id IS NULL"
                        + " ORDER BY ml.organization_legal_name",
                (rs, i) -> {
                    String fullName = rs.getString("primary_contact_name");
                    String[] parts = splitContactName(fullName);
                    String categoryCode = rs.getString("category_code");
                    String categoryLabel = rs.getString("category_label");
                    return new AdminSecurityView.MemberSummary(
                            rs.getString("id"),
                            rs.getString("organization_legal_name"),
                            rs.getString("membership_number"),
                            categoryLabel != null ? categoryLabel : categoryCode,
                            rs.getString("primary_group_name"),
                            parts[0],
                            parts[1],
                            rs.getString("primary_contact_email"),
                            rs.getString("primary_contact_phone"),
                            null);
                });
    }

    /**
     * Sépare un nom complet en prénom / nom pour amorcer le formulaire. Le premier mot est
     * le prénom, le reste le nom ; à défaut de nom, le champ reste vide plutôt que dupliqué.
     * Simple pré-remplissage, corrigeable — jamais une vérité que le système imposerait.
     */
    private static String[] splitContactName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return new String[] {null, null};
        }
        String trimmed = fullName.trim();
        int space = trimmed.indexOf(' ');
        if (space < 0) {
            return new String[] {trimmed, null};
        }
        return new String[] {trimmed.substring(0, space), trimmed.substring(space + 1).trim()};
    }

    private List<AdminSecurityView.Account> accounts() {
        return jdbc.query(
                "SELECT ua.id, ua.display_name, ua.email, ua.status, ua.mfa_enabled, ua.last_login_at,"
                        + " ua.account_type, ua.phone, ua.job_title, ua.organization, ua.department,"
                        + " r.id AS role_id, r.label AS role_label"
                        + " FROM iam.user_account ua"
                        + " LEFT JOIN LATERAL (SELECT ur.role_id FROM iam.user_role ur"
                        + "   WHERE ur.user_id = ua.id ORDER BY ur.created_at LIMIT 1) pr ON true"
                        + " LEFT JOIN iam.role r ON r.id = pr.role_id"
                        + " ORDER BY ua.display_name",
                (rs, i) -> {
                    boolean mfa = rs.getBoolean("mfa_enabled");
                    OffsetDateTime lastLogin = rs.getObject("last_login_at", OffsetDateTime.class);
                    boolean suspended = "SUSPENDED".equals(rs.getString("status"));
                    boolean invited = lastLogin == null && !mfa;
                    // La suspension prime sur l'invitation : un compte suspendu qui ne s'est
                    // jamais connecté reste suspendu, et l'annoncer « invité » masquerait la
                    // sanction à l'écran qui sert justement à la constater.
                    String status = suspended ? "SUSPENDED" : invited ? "INVITED" : "ACTIVE";
                    String twoFactor = mfa ? "ENABLED" : invited ? "PENDING" : "DISABLED";
                    String roleId = rs.getString("role_id");
                    return new AdminSecurityView.Account(
                            rs.getString("id"),
                            rs.getString("display_name"),
                            rs.getString("email"),
                            roleId == null ? "" : roleId,
                            rs.getString("role_label") == null ? "Aucun rôle" : rs.getString("role_label"),
                            rs.getString("account_type"),
                            rs.getString("phone"),
                            rs.getString("job_title"),
                            rs.getString("organization"),
                            rs.getString("department"),
                            status, twoFactor,
                            lastLogin == null ? null : lastLogin.toString(),
                            lastLogin == null ? null : lastLogin.format(LABEL),
                            0);
                });
    }

    private List<AdminSecurityView.Role> roles() {
        return jdbc.query(
                "SELECT r.id, r.label, count(DISTINCT ur.user_id) AS accounts"
                        + " FROM iam.role r LEFT JOIN iam.user_role ur ON ur.role_id = r.id"
                        + " GROUP BY r.id, r.label ORDER BY r.label",
                (rs, i) -> new AdminSecurityView.Role(
                        rs.getString("id"),
                        rs.getString("label"),
                        "Rôle de la plateforme CNPM",
                        rs.getInt("accounts")));
    }

    private List<AdminSecurityView.PermissionRow> permissions() {
        // Roles habilités par permission (granted = true). Matrice en lecture seule.
        Map<String, List<AdminSecurityView.Grant>> grantsByPermission = jdbc.query(
                "SELECT p.id AS perm_id, r.id AS role_id, r.label AS role_label"
                        + " FROM iam.permission p"
                        + " JOIN iam.role_permission rp ON rp.permission_id = p.id"
                        + " JOIN iam.role r ON r.id = rp.role_id",
                rs -> {
                    Map<String, List<AdminSecurityView.Grant>> map = new java.util.HashMap<>();
                    while (rs.next()) {
                        map.computeIfAbsent(rs.getString("perm_id"), k -> new java.util.ArrayList<>())
                                .add(new AdminSecurityView.Grant(
                                        rs.getString("role_id"), rs.getString("role_label"), true));
                    }
                    return map;
                });
        return jdbc.query(
                "SELECT id, code, domain, description FROM iam.permission ORDER BY domain, code",
                (rs, i) -> new AdminSecurityView.PermissionRow(
                        rs.getString("id"),
                        rs.getString("code"),
                        rs.getString("domain"),
                        rs.getString("description"),
                        grantsByPermission.getOrDefault(rs.getString("id"), List.of()).stream()
                                .sorted((a, b) -> a.roleLabel().compareToIgnoreCase(b.roleLabel()))
                                .collect(Collectors.toList())));
    }
}
