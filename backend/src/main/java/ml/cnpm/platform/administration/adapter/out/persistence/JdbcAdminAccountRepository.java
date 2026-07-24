package ml.cnpm.platform.administration.adapter.out.persistence;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.administration.application.AdminAccountDraft;
import ml.cnpm.platform.administration.application.AdminSecurityView;
import ml.cnpm.platform.administration.application.port.out.AdminAccountRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/**
 * Adaptateur sortant des écritures de comptes, sur le schéma {@code iam}.
 *
 * <p>La projection lue ici est volontairement identique à celle de l'instantané
 * (@link ml.cnpm.platform.administration.application.AdminSecurityQueryService) : après une
 * suspension ou une réinitialisation, l'écran doit lire exactement ce que la liste
 * afficherait au rechargement, sinon la ligne modifiée divergerait du tableau.
 */
@Repository
public class JdbcAdminAccountRepository implements AdminAccountRepository {

    private static final DateTimeFormatter LABEL =
            DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm", Locale.FRENCH);

    /** Colonnes et jointure du rôle principal, partagées par toutes les lectures d'un compte. */
    private static final String SELECT_ACCOUNT =
            "SELECT ua.id, ua.display_name, ua.email, ua.status, ua.mfa_enabled, ua.last_login_at,"
                    + " ua.account_type, ua.phone, ua.job_title, ua.organization, ua.department,"
                    + " r.id AS role_id, r.label AS role_label"
                    + " FROM iam.user_account ua"
                    + " LEFT JOIN LATERAL (SELECT ur.role_id FROM iam.user_role ur"
                    + "   WHERE ur.user_id = ua.id ORDER BY ur.created_at LIMIT 1) pr ON true"
                    + " LEFT JOIN iam.role r ON r.id = pr.role_id";

    private final JdbcTemplate jdbc;

    JdbcAdminAccountRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<AdminSecurityView.Account> findByEmail(String email) {
        return first(jdbc.query(SELECT_ACCOUNT + " WHERE lower(ua.email) = lower(?)", MAPPER, email));
    }

    @Override
    public Optional<AdminSecurityView.Account> findById(UUID id) {
        return first(jdbc.query(SELECT_ACCOUNT + " WHERE ua.id = ?", MAPPER, id));
    }

    @Override
    public boolean roleExists(UUID roleId) {
        Integer count =
                jdbc.queryForObject("SELECT count(*) FROM iam.role WHERE id = ?", Integer.class, roleId);
        return count != null && count > 0;
    }

    @Override
    public AdminSecurityView.Account create(AdminAccountDraft draft, UUID actorUserId) {
        UUID id =
                jdbc.queryForObject(
                        "INSERT INTO iam.user_account (email, display_name, first_name, last_name,"
                                + " phone, job_title, organization, department, account_type, member_id,"
                                + " status, created_by, updated_by)"
                                + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?) RETURNING id",
                        UUID.class,
                        draft.normalizedEmail(),
                        draft.displayName(),
                        draft.firstName().trim(),
                        draft.lastName().trim(),
                        blankToNull(draft.phone()),
                        blankToNull(draft.jobTitle()),
                        blankToNull(draft.organization()),
                        blankToNull(draft.department()),
                        draft.accountType(),
                        draft.memberId(),
                        actorUserId,
                        actorUserId);

        jdbc.update(
                "INSERT INTO iam.user_role (user_id, role_id, created_by, updated_by)"
                        + " VALUES (?, ?, ?, ?)",
                id,
                draft.roleId(),
                actorUserId,
                actorUserId);

        return findById(id).orElseThrow();
    }

    @Override
    public AdminSecurityView.Account updateStatus(UUID id, String status, UUID actorUserId) {
        jdbc.update(
                "UPDATE iam.user_account SET status = ?, updated_at = now(), updated_by = ?,"
                        + " version = version + 1 WHERE id = ?",
                status,
                actorUserId,
                id);
        return findById(id).orElseThrow();
    }

    @Override
    public AdminSecurityView.Account resetTwoFactor(UUID id, UUID actorUserId) {
        // Tout l'état du second facteur part ensemble : garder la borne anti-rejeu ou les
        // codes de secours d'un secret effacé laisserait des restes exploitables.
        jdbc.update(
                "UPDATE iam.user_account SET mfa_enabled = false, mfa_secret_encrypted = NULL,"
                        + " mfa_recovery_code_hashes = NULL, mfa_last_accepted_step = NULL,"
                        + " mfa_enrolled_at = NULL, updated_at = now(), updated_by = ?,"
                        + " version = version + 1 WHERE id = ?",
                actorUserId,
                id);
        return findById(id).orElseThrow();
    }

    @Override
    public void delete(UUID id) {
        // user_role, mfa_registration et account_credential_token portent ON DELETE CASCADE :
        // la suppression du compte emporte ses rattachements sans laisser d'orphelin.
        jdbc.update("DELETE FROM iam.user_account WHERE id = ?", id);
    }

    private static Optional<AdminSecurityView.Account> first(List<AdminSecurityView.Account> rows) {
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    /** Une chaîne vide n'est pas une valeur : elle se range en base comme une absence. */
    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static final RowMapper<AdminSecurityView.Account> MAPPER =
            (rs, i) -> {
                boolean mfa = rs.getBoolean("mfa_enabled");
                OffsetDateTime lastLogin = rs.getObject("last_login_at", OffsetDateTime.class);
                boolean suspended = "SUSPENDED".equals(rs.getString("status"));
                boolean invited = lastLogin == null && !mfa;
                // La suspension prime sur l'invitation : un compte suspendu qui ne s'est jamais
                // connecté est suspendu, et l'annoncer « invité » masquerait la sanction.
                String status = suspended ? "SUSPENDED" : invited ? "INVITED" : "ACTIVE";
                String twoFactor = mfa ? "ENABLED" : invited ? "PENDING" : "DISABLED";
                String roleId = rs.getString("role_id");
                String roleLabel = rs.getString("role_label");
                return new AdminSecurityView.Account(
                        rs.getString("id"),
                        rs.getString("display_name"),
                        rs.getString("email"),
                        roleId == null ? "" : roleId,
                        roleLabel == null ? "Aucun rôle" : roleLabel,
                        rs.getString("account_type"),
                        rs.getString("phone"),
                        rs.getString("job_title"),
                        rs.getString("organization"),
                        rs.getString("department"),
                        status,
                        twoFactor,
                        lastLogin == null ? null : lastLogin.toString(),
                        lastLogin == null ? null : lastLogin.format(LABEL),
                        0);
            };
}
