package ml.cnpm.platform.shared.security;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Amorçage d'un compte super-administrateur NATIF (AUTH-DEC-020).
 *
 * <p>Au démarrage, si {@code CNPM_BOOTSTRAP_ADMIN_EMAIL} et {@code CNPM_BOOTSTRAP_ADMIN_PASSWORD}
 * sont fournis par l'environnement ET que le compte n'existe pas déjà, il est créé dans
 * {@code iam.user_account} avec une empreinte bcrypt du mot de passe et le rôle
 * {@code SUPER_ADMIN_TECH}. Le mot de passe n'est JAMAIS dans le dépôt : il vient de
 * l'environnement, comme la clé bootstrap de Keycloak. Le compte naît avec le second facteur
 * à enrôler (mfa_enabled = false) : il devra l'activer à sa première connexion.
 *
 * <p>Idempotent : relancer l'application ne recrée ni n'écrase un compte existant.
 */
@Component
public class NativeAdminBootstrap {

    private static final Logger LOG = LoggerFactory.getLogger(NativeAdminBootstrap.class);

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String displayName;
    private final String roleCode;

    public NativeAdminBootstrap(
            JdbcTemplate jdbc,
            PasswordEncoder passwordEncoder,
            @Value("${CNPM_BOOTSTRAP_ADMIN_EMAIL:}") String email,
            @Value("${CNPM_BOOTSTRAP_ADMIN_PASSWORD:}") String password,
            @Value("${CNPM_BOOTSTRAP_ADMIN_NAME:Super administrateur}") String displayName,
            @Value("${CNPM_BOOTSTRAP_ADMIN_ROLE:SUPER_ADMIN_TECH}") String roleCode) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
        this.displayName = displayName;
        this.roleCode = roleCode;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void ensureAdmin() {
        if (email.isBlank() || password.isBlank()) {
            LOG.info("Amorçage super-admin natif désactivé (CNPM_BOOTSTRAP_ADMIN_* absentes).");
            return;
        }
        Integer existing = jdbc.queryForObject(
                "SELECT count(*) FROM iam.user_account WHERE lower(email) = lower(?)",
                Integer.class, email);
        if (existing != null && existing > 0) {
            LOG.info("Amorçage : le compte {} existe déjà, aucune action.", email);
            return;
        }
        UUID roleId = jdbc.query("SELECT id FROM iam.role WHERE code = ?",
                (rs, i) -> rs.getObject("id", UUID.class), roleCode).stream().findFirst().orElse(null);
        if (roleId == null) {
            LOG.warn("Amorçage abandonné : rôle {} introuvable dans iam.role.", roleCode);
            return;
        }

        UUID userId = UUID.randomUUID();
        jdbc.update(
                "INSERT INTO iam.user_account (id, email, display_name, status, password_hash, mfa_enabled) "
                        + "VALUES (?, ?, ?, 'ACTIVE', ?, false)",
                userId, email, displayName, passwordEncoder.encode(password));
        jdbc.update(
                "INSERT INTO iam.user_role (id, user_id, role_id, scope_type) VALUES (?, ?, ?, 'GLOBAL')",
                UUID.randomUUID(), userId, roleId);

        LOG.info("Amorçage : compte super-administrateur natif créé pour {} (rôle {}, 2FA à enrôler).",
                email, roleCode);
    }
}
