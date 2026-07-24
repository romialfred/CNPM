package ml.cnpm.platform.shared.security.credential;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Activation d'un compte et récupération d'accès (ENR étape 18, PRT-001).
 *
 * <p><b>Le mot de passe ne transite jamais par un tiers.</b> L'administration n'émet qu'un
 * jeton à usage unique et à durée bornée ; le titulaire pose lui-même son secret. Un
 * administrateur ne connaît donc jamais le mot de passe d'un utilisateur — sans quoi toute
 * action de ce dernier deviendrait contestable.
 *
 * <p>Ce qui n'est jamais écrit nulle part : le jeton en clair (seule son empreinte SHA-256
 * est stockée), le mot de passe (seule son empreinte bcrypt l'est), et ni l'un ni l'autre
 * dans un journal ou un événement d'audit.
 */
@Service
public class AccountCredentialService {

    /**
     * Durée de validité d'un jeton.
     *
     * <p>Paramètre technique, non arbitré par une source normative : 24 heures ferme la
     * fenêtre d'usage d'un jeton intercepté tout en laissant à son destinataire un délai
     * ouvré raisonnable. À confirmer par la politique de sécurité approuvée (AUTH-DEC-027).
     */
    static final Duration TOKEN_LIFETIME = Duration.ofHours(24);

    /**
     * Longueur minimale du mot de passe.
     *
     * <p>Même statut : plancher technique, aligné sur la recommandation NIST de privilégier
     * la longueur plutôt que la complexité imposée. À confirmer (AUTH-DEC-027).
     */
    static final int MIN_PASSWORD_LENGTH = 12;

    private static final String ENTITY_TYPE = "iam.user_account";
    private static final String ACTION_TOKEN_ISSUED = "USER_ACCOUNT.CREDENTIAL_TOKEN_ISSUED";
    private static final String ACTION_PASSWORD_SET = "USER_ACCOUNT.PASSWORD_SET";

    public static final String PURPOSE_ACTIVATION = "ACTIVATION";
    public static final String PURPOSE_RESET = "PASSWORD_RESET";

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;
    private final AuditRecorder auditRecorder;
    private final SecureRandom random = new SecureRandom();

    AccountCredentialService(
            JdbcTemplate jdbc, PasswordEncoder passwordEncoder, AuditRecorder auditRecorder) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
        this.auditRecorder = auditRecorder;
    }

    /**
     * Jeton émis, remis UNE SEULE FOIS à l'appelant.
     *
     * @param token valeur en clair, à transmettre au titulaire et à ne conserver nulle part
     * @param activation vrai lorsqu'il s'agit d'une première mise en service du compte
     */
    public record IssuedToken(String token, OffsetDateTime expiresAt, boolean activation) { }

    /**
     * Émet un jeton pour le compte visé et invalide ceux qui restaient en attente.
     *
     * <p>L'invalidation des jetons antérieurs est délibérée : plusieurs jetons vivants pour
     * un même compte multiplieraient les portes d'entrée, et un jeton égaré resterait
     * utilisable après qu'un nouveau a été demandé — c'est précisément le scénario d'un
     * accès détourné.
     *
     * @throws ResourceNotFoundException si aucun compte ne porte cet identifiant
     * @throws StateConflictException si le compte est suspendu : rétablir son accès avant de
     *     lever la suspension contournerait la décision de suspension
     */
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasAuthority('PERM_IAM.USER.WRITE')")
    @Transactional
    public IssuedToken issue(UUID accountId, UUID actorUserId, UUID correlationId) {
        AccountState account = requireAccount(accountId);
        if (account.suspended()) {
            throw new StateConflictException(
                    "Le compte est suspendu : réactivez-le avant de rétablir son accès.");
        }

        jdbc.update(
                "UPDATE iam.account_credential_token SET consumed_at = now()"
                        + " WHERE user_id = ? AND consumed_at IS NULL",
                accountId);

        String token = newToken();
        boolean activation = !account.hasPassword();
        OffsetDateTime expiresAt = OffsetDateTime.now().plus(TOKEN_LIFETIME);
        jdbc.update(
                "INSERT INTO iam.account_credential_token"
                        + " (created_by, user_id, purpose, token_hash, expires_at)"
                        + " VALUES (?, ?, ?, ?, ?)",
                actorUserId,
                accountId,
                activation ? PURPOSE_ACTIVATION : PURPOSE_RESET,
                sha256Hex(token),
                expiresAt);

        // L'audit consigne l'émission, jamais le jeton : une trace qui contient le secret
        // qu'elle protège n'est plus une trace, c'est une fuite.
        auditRecorder.record(
                new AuditEntry(
                        "USER",
                        actorUserId,
                        ACTION_TOKEN_ISSUED,
                        ENTITY_TYPE,
                        accountId,
                        null,
                        fingerprint(accountId, activation ? PURPOSE_ACTIVATION : PURPOSE_RESET),
                        correlationId));

        return new IssuedToken(token, expiresAt, activation);
    }

    /**
     * Pose le mot de passe du compte désigné par le jeton, puis consomme le jeton.
     *
     * <p>Le second facteur n'est pas touché : un compte qui avait enrôlé une application
     * d'authentification la conserve. Poser un mot de passe ne doit pas abaisser la garde
     * déjà en place.
     *
     * @throws StateConflictException si le jeton est inconnu, expiré ou déjà consommé — les
     *     trois cas se répondent à l'identique, pour ne pas indiquer lequel est vrai
     */
    @Transactional
    public void setPassword(String token, String password, UUID correlationId) {
        if (password == null || password.strip().length() < MIN_PASSWORD_LENGTH) {
            throw new StateConflictException(
                    "Le mot de passe doit comporter au moins "
                            + MIN_PASSWORD_LENGTH
                            + " caractères.");
        }

        UUID accountId =
                jdbc
                        .query(
                                "SELECT user_id FROM iam.account_credential_token"
                                        + " WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > now()",
                                (rs, i) -> rs.getObject("user_id", UUID.class),
                                sha256Hex(token == null ? "" : token))
                        .stream()
                        .findFirst()
                        .orElseThrow(
                                () ->
                                        new StateConflictException(
                                                "Ce lien n’est plus valable. Demandez-en un nouveau."));

        jdbc.update(
                "UPDATE iam.user_account SET password_hash = ?, updated_at = now(),"
                        + " version = version + 1 WHERE id = ?",
                passwordEncoder.encode(password),
                accountId);
        jdbc.update(
                "UPDATE iam.account_credential_token SET consumed_at = now() WHERE token_hash = ?",
                sha256Hex(token));

        auditRecorder.record(
                new AuditEntry(
                        "USER",
                        accountId,
                        ACTION_PASSWORD_SET,
                        ENTITY_TYPE,
                        accountId,
                        null,
                        fingerprint(accountId, ACTION_PASSWORD_SET),
                        correlationId));
    }

    private record AccountState(boolean hasPassword, boolean suspended) { }

    private AccountState requireAccount(UUID accountId) {
        return jdbc
                .query(
                        "SELECT password_hash, status FROM iam.user_account WHERE id = ?",
                        (rs, i) ->
                                new AccountState(
                                        rs.getString("password_hash") != null,
                                        "SUSPENDED".equals(rs.getString("status"))),
                        accountId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Compte introuvable."));
    }

    /** 32 octets d'aléa cryptographique, en base64 URL — transportable dans un lien. */
    private String newToken() {
        byte[] material = new byte[32];
        random.nextBytes(material);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(material);
    }

    private static String sha256Hex(String value) {
        try {
            return HexFormat.of()
                    .formatHex(
                            MessageDigest.getInstance("SHA-256")
                                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 indisponible", ex);
        }
    }

    /** Empreinte d'audit : elle situe l'action sans rien révéler du secret manipulé. */
    private static String fingerprint(UUID accountId, String marker) {
        return sha256Hex(accountId + "|" + marker);
    }
}
