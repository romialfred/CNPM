package ml.cnpm.platform.administration.application;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.shared.api.Hashing;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Octroi d'une permission à un rôle depuis l'écran « Administration et sécurité ».
 *
 * <p>La lecture de la matrice ({@link AdminSecurityQueryService}) reste séparée de l'écriture,
 * portée ici et strictement habilitée ({@code PERM_IAM.ROLE.ASSIGN}). Le catalogue des CODES de
 * permission n'est jamais modifié : on ne fait qu'ajouter ou retirer une ligne
 * {@code iam.role_permission} (l'association rôle ↔ droit). Toute mutation est auditée.
 */
@Service
public class AdminRolePermissionService {

    private static final String ENTITY_TYPE = "iam.role_permission";
    private static final String ACTION_GRANTED = "ROLE_PERMISSION.GRANTED";
    private static final String ACTION_REVOKED = "ROLE_PERMISSION.REVOKED";

    private final JdbcTemplate jdbc;
    private final AuditRecorder auditRecorder;

    AdminRolePermissionService(JdbcTemplate jdbc, AuditRecorder auditRecorder) {
        this.jdbc = jdbc;
        this.auditRecorder = auditRecorder;
    }

    /**
     * Accorde ({@code granted=true}) ou retire ({@code granted=false}) une permission à un rôle,
     * puis restitue la ligne de matrice à jour (droit + rôles habilités).
     *
     * @throws ResourceNotFoundException si le rôle ou la permission n'existe pas
     */
    @PreAuthorize("hasAuthority('PERM_IAM.ROLE.ASSIGN')")
    @Transactional
    public AdminSecurityView.PermissionRow setGrant(
            UUID roleId, UUID permissionId, boolean granted, UUID actorUserId, UUID correlationId) {
        requireExists("iam.role", roleId, "Rôle introuvable.");
        requireExists("iam.permission", permissionId, "Permission introuvable.");

        if (granted) {
            jdbc.update(
                    "INSERT INTO iam.role_permission (role_id, permission_id, created_by)"
                            + " VALUES (?, ?, ?)"
                            + " ON CONFLICT (role_id, permission_id) DO NOTHING",
                    roleId,
                    permissionId,
                    actorUserId);
        } else {
            jdbc.update(
                    "DELETE FROM iam.role_permission WHERE role_id = ? AND permission_id = ?",
                    roleId,
                    permissionId);
        }

        auditRecorder.record(
                AuditEntry.created(
                        actorUserId,
                        granted ? ACTION_GRANTED : ACTION_REVOKED,
                        ENTITY_TYPE,
                        permissionId,
                        Hashing.sha256Hex(String.join("|", roleId.toString(), permissionId.toString(),
                                Boolean.toString(granted))),
                        correlationId));

        return permissionRow(permissionId);
    }

    private void requireExists(String table, UUID id, String message) {
        Integer count =
                jdbc.queryForObject("SELECT count(*) FROM " + table + " WHERE id = ?", Integer.class, id);
        if (count == null || count == 0) {
            throw new ResourceNotFoundException(message);
        }
    }

    /** Reconstruit une ligne de matrice : le droit et la liste de ses rôles habilités. */
    private AdminSecurityView.PermissionRow permissionRow(UUID permissionId) {
        List<AdminSecurityView.Grant> grants =
                jdbc.query(
                        "SELECT r.id, r.label FROM iam.role_permission rp"
                                + " JOIN iam.role r ON r.id = rp.role_id"
                                + " WHERE rp.permission_id = ?"
                                + " ORDER BY r.label",
                        (rs, i) ->
                                new AdminSecurityView.Grant(
                                        rs.getString("id"), rs.getString("label"), true),
                        permissionId);
        return jdbc
                .query(
                        "SELECT id, code, domain, description FROM iam.permission WHERE id = ?",
                        (rs, i) ->
                                new AdminSecurityView.PermissionRow(
                                        rs.getString("id"),
                                        rs.getString("code"),
                                        rs.getString("domain"),
                                        rs.getString("description"),
                                        grants.stream().collect(Collectors.toList())),
                        permissionId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Permission introuvable."));
    }
}
