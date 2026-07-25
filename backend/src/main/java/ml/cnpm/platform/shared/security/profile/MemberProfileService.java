package ml.cnpm.platform.shared.security.profile;

import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.shared.api.Hashing;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Profil du compte connecté et gestion de sa photo, en self-service.
 *
 * <p>Le périmètre est le compte authentifié lui-même : le service n'opère jamais sur un autre
 * compte que celui du jeton. La photo est bornée en type et en taille avant stockage ; aucun
 * secret n'est journalisé, seule l'empreinte de l'action rejoint l'audit.
 */
@Service
public class MemberProfileService {

    /** Types d'image acceptés pour une photo de profil. */
    private static final Set<String> ALLOWED_TYPES =
            Set.of("image/png", "image/jpeg", "image/webp");

    /** Taille maximale décodée : une photo de profil n'a pas besoin de plus. */
    private static final int MAX_BYTES = 512 * 1024;

    private static final String ENTITY_TYPE = "iam.user_account";
    private static final String ACTION_AVATAR_UPDATED = "USER_ACCOUNT.AVATAR_UPDATED";
    private static final String ACTION_AVATAR_REMOVED = "USER_ACCOUNT.AVATAR_REMOVED";

    private final JdbcTemplate jdbc;
    private final AuditRecorder auditRecorder;

    MemberProfileService(JdbcTemplate jdbc, AuditRecorder auditRecorder) {
        this.jdbc = jdbc;
        this.auditRecorder = auditRecorder;
    }

    @Transactional(readOnly = true)
    public MemberProfileView get(UUID accountId) {
        List<MemberProfileView> rows =
                jdbc.query(
                        "SELECT display_name, email, organization, job_title, phone, avatar_content,"
                                + " avatar_content_type, avatar_updated_at"
                                + " FROM iam.user_account WHERE id = ?",
                        (rs, i) -> {
                            byte[] avatar = rs.getBytes("avatar_content");
                            String type = rs.getString("avatar_content_type");
                            OffsetDateTime updated =
                                    rs.getObject("avatar_updated_at", OffsetDateTime.class);
                            String dataUri =
                                    avatar == null || type == null
                                            ? null
                                            : "data:"
                                                    + type
                                                    + ";base64,"
                                                    + Base64.getEncoder().encodeToString(avatar);
                            return new MemberProfileView(
                                    rs.getString("display_name"),
                                    rs.getString("email"),
                                    rs.getString("organization"),
                                    rs.getString("job_title"),
                                    rs.getString("phone"),
                                    dataUri,
                                    updated == null ? null : updated.toString());
                        },
                        accountId);
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("Compte introuvable.");
        }
        return rows.get(0);
    }

    /**
     * Change la photo de profil du compte connecté.
     *
     * @param contentType type MIME déclaré (doit être une image acceptée)
     * @param base64 contenu de l'image encodé en base64
     * @throws StateConflictException si le type n'est pas accepté ou la taille dépasse la limite
     */
    @Transactional
    public MemberProfileView updateAvatar(
            UUID accountId, String contentType, String base64, UUID correlationId) {
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new StateConflictException("Format d’image non accepté (PNG, JPEG ou WebP).");
        }
        byte[] bytes = decode(base64);
        if (bytes.length == 0) {
            throw new StateConflictException("L’image est vide.");
        }
        if (bytes.length > MAX_BYTES) {
            throw new StateConflictException("L’image dépasse 512 Ko ; choisissez une photo plus légère.");
        }
        requireAccount(accountId);

        jdbc.update(
                "UPDATE iam.user_account SET avatar_content = ?, avatar_content_type = ?,"
                        + " avatar_updated_at = now(), updated_at = now(), version = version + 1"
                        + " WHERE id = ?",
                bytes,
                contentType.toLowerCase(),
                accountId);
        auditRecorder.record(
                new AuditEntry(
                        "USER",
                        accountId,
                        ACTION_AVATAR_UPDATED,
                        ENTITY_TYPE,
                        accountId,
                        null,
                        Hashing.sha256Hex(accountId + "|" + contentType + "|" + bytes.length),
                        correlationId));
        return get(accountId);
    }

    /** Retire la photo de profil. */
    @Transactional
    public MemberProfileView deleteAvatar(UUID accountId, UUID correlationId) {
        requireAccount(accountId);
        jdbc.update(
                "UPDATE iam.user_account SET avatar_content = NULL, avatar_content_type = NULL,"
                        + " avatar_updated_at = now(), updated_at = now(), version = version + 1"
                        + " WHERE id = ?",
                accountId);
        auditRecorder.record(
                new AuditEntry(
                        "USER",
                        accountId,
                        ACTION_AVATAR_REMOVED,
                        ENTITY_TYPE,
                        accountId,
                        null,
                        Hashing.sha256Hex(accountId + "|removed"),
                        correlationId));
        return get(accountId);
    }

    private void requireAccount(UUID accountId) {
        Integer count =
                jdbc.queryForObject(
                        "SELECT count(*) FROM iam.user_account WHERE id = ?", Integer.class, accountId);
        if (count == null || count == 0) {
            throw new ResourceNotFoundException("Compte introuvable.");
        }
    }

    private static byte[] decode(String base64) {
        if (base64 == null || base64.isBlank()) {
            return new byte[0];
        }
        // Tolère un préfixe data: si le client l'a laissé.
        String payload = base64.contains(",") ? base64.substring(base64.indexOf(',') + 1) : base64;
        try {
            return Base64.getDecoder().decode(payload.trim());
        } catch (IllegalArgumentException notBase64) {
            throw new StateConflictException("Image illisible : encodage invalide.");
        }
    }
}
