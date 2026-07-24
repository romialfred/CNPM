package ml.cnpm.platform.administration.application;

import java.util.List;

/**
 * Instantané de l'écran « Administration et sécurité » (comptes, rôles, permissions,
 * sessions, audit), projeté vers le contrat front {@code AdminSecuritySnapshot}.
 *
 * <p>Lecture seule ; aucun secret n'y transite (ni mot de passe, ni jeton, ni OTP). Les
 * sessions et l'audit sont vides ici : la session native est sans état côté serveur (JWT)
 * et le journal d'audit a son propre point d'accès.
 */
public record AdminSecurityView(
        List<Account> accounts,
        List<Role> roles,
        List<PermissionRow> permissions,
        List<Object> sessions,
        List<Object> audit,
        List<PolicyItem> policy,
        Posture posture,
        Counts counts,
        List<MemberSummary> membersWithoutAccount,
        boolean canManagePermissions) {

    /**
     * Adhésion enregistrée ne disposant pas encore d'un compte utilisateur, proposée à la
     * création d'un compte membre. Le contact principal pré-remplit le formulaire ;
     * l'opérateur reste libre de le corriger.
     */
    public record MemberSummary(
            String id,
            String organizationName,
            String membershipNumber,
            String categoryLabel,
            String groupLabel,
            String contactFirstName,
            String contactLastName,
            String contactEmail,
            String contactPhone,
            String contactJobTitle) { }

    public record Account(
            String id, String fullName, String email, String roleId, String roleLabel,
            String accountType, String phone, String jobTitle, String organization, String department,
            String status, String twoFactor, String lastLoginAt, String lastLoginLabel,
            int activeSessions) { }

    public record Role(String id, String label, String description, int accounts) { }

    public record PermissionRow(
            String id, String label, String domain, String description, List<Grant> grants) { }

    public record Grant(String roleId, String roleLabel, boolean granted) { }

    public record PolicyItem(String label, String value) { }

    public record Posture(
            int accountsTotal, int activeAccounts, int suspendedAccounts,
            int twoFactorEnabled, int openSessions) { }

    public record Counts(int accounts, int roles, int permissions, int sessions, int auditEntries) { }
}
