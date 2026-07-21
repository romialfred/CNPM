package ml.cnpm.platform.shared.security.mfa;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Accès JDBC au schéma {@code iam} pour l'authentification native et le second facteur —
 * même approche que {@link ml.cnpm.platform.shared.security.PermissionDirectory} (SQL brut,
 * sans entité JPA, donc sans risque de validation de schéma). Implémente le port
 * {@link MfaAccountStore} et fournit la recherche de compte par courriel pour le login.
 */
@Repository
public class IamNativeAccountJdbc implements MfaAccountStore {

    /** Vue d'authentification : ce qu'il faut pour vérifier le mot de passe et router vers le 2FA. */
    public record AuthAccount(UUID id, String email, String passwordHash, Set<String> roles,
            boolean mfaEnabled, String mfaSecretEncrypted) { }

    private final JdbcTemplate jdbc;

    public IamNativeAccountJdbc(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Rôles réalm actifs d'un compte (codes bruts, comme dans le jeton Keycloak). */
    private Set<String> rolesOf(UUID accountId) {
        List<String> codes = jdbc.query(
                "SELECT r.code FROM iam.user_role ur JOIN iam.role r ON r.id = ur.role_id "
                        + "WHERE ur.user_id = ? AND (ur.valid_to IS NULL OR ur.valid_to > now())",
                (rs, i) -> rs.getString(1), accountId);
        return Set.copyOf(codes);
    }

    public Optional<AuthAccount> findAuthByEmail(String email) {
        try {
            AuthAccount partial = jdbc.queryForObject(
                    "SELECT id, email, password_hash, mfa_enabled, mfa_secret_encrypted "
                            + "FROM iam.user_account WHERE lower(email) = lower(?) AND status = 'ACTIVE'",
                    (rs, i) -> new AuthAccount(
                            rs.getObject("id", UUID.class),
                            rs.getString("email"),
                            rs.getString("password_hash"),
                            Set.of(),
                            rs.getBoolean("mfa_enabled"),
                            rs.getString("mfa_secret_encrypted")),
                    email);
            if (partial == null) {
                return Optional.empty();
            }
            return Optional.of(new AuthAccount(partial.id(), partial.email(), partial.passwordHash(),
                    rolesOf(partial.id()), partial.mfaEnabled(), partial.mfaSecretEncrypted()));
        } catch (EmptyResultDataAccessException notFound) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<MfaAccount> findById(UUID accountId) {
        try {
            MfaAccount account = jdbc.queryForObject(
                    "SELECT id, email, mfa_enabled, mfa_secret_encrypted, mfa_recovery_code_hashes, "
                            + "mfa_last_accepted_step, mfa_enrolled_at FROM iam.user_account WHERE id = ?",
                    (rs, i) -> {
                        UUID id = rs.getObject("id", UUID.class);
                        String email = rs.getString("email");
                        boolean enabled = rs.getBoolean("mfa_enabled");
                        String secret = rs.getString("mfa_secret_encrypted");
                        String recovery = rs.getString("mfa_recovery_code_hashes");
                        // Lire le pas ET wasNull() ENSEMBLE, avant toute autre colonne.
                        long lastStepRaw = rs.getLong("mfa_last_accepted_step");
                        Long lastStep = rs.wasNull() ? null : lastStepRaw;
                        Timestamp enrolledAt = rs.getTimestamp("mfa_enrolled_at");
                        return new MfaAccount(id, email, rolesOf(id), enabled, secret, recovery,
                                lastStep, enrolledAt == null ? null : enrolledAt.toInstant());
                    },
                    accountId);
            return Optional.ofNullable(account);
        } catch (EmptyResultDataAccessException notFound) {
            return Optional.empty();
        }
    }

    @Override
    public void save(MfaAccount account) {
        Instant enrolledAt = account.mfaEnrolledAt();
        int updated = jdbc.update(
                "UPDATE iam.user_account SET mfa_enabled = ?, mfa_secret_encrypted = ?, "
                        + "mfa_recovery_code_hashes = ?, mfa_last_accepted_step = ?, "
                        + "mfa_enrolled_at = ?, updated_at = now(), version = version + 1 WHERE id = ?",
                account.mfaEnabled(),
                account.mfaSecretEncrypted(),
                account.mfaRecoveryCodeHashes(),
                account.mfaLastAcceptedStep(),
                enrolledAt == null ? null : Timestamp.from(enrolledAt),
                account.id());
        if (updated == 0) {
            throw new IllegalStateException("MFA_ACCOUNT_NOT_FOUND");
        }
    }
}
