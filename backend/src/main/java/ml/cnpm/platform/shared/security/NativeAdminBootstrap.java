package ml.cnpm.platform.shared.security;

import java.util.Arrays;
import java.util.List;
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
 * sont fournis par l'environnement, le compte est créé dans {@code iam.user_account} (s'il
 * est absent) avec une empreinte bcrypt du mot de passe, puis ses rôles sont réconciliés à
 * partir de {@code CNPM_BOOTSTRAP_ADMIN_ROLE} (liste séparée par des virgules, défaut
 * {@code SUPER_ADMIN_TECH,ADMIN_FONCTIONNEL} — accès sans restriction du super-admin, cf.
 * AUTH-DEC-021). Le mot de passe n'est JAMAIS dans le dépôt : il vient de l'environnement.
 * Le compte naît avec le second facteur à enrôler (mfa_enabled = false).
 *
 * <p>Idempotent : relancer l'application n'écrase ni le compte ni son mot de passe ; elle
 * ajoute seulement les rôles configurés encore manquants.
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
            @Value("${CNPM_BOOTSTRAP_ADMIN_ROLE:SUPER_ADMIN_TECH,ADMIN_FONCTIONNEL}") String roleCode) {
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
        List<String> roleCodes = Arrays.stream(roleCode.split(","))
                .map(String::trim).filter(code -> !code.isBlank()).distinct().toList();

        UUID userId = jdbc.query("SELECT id FROM iam.user_account WHERE lower(email) = lower(?)",
                (rs, i) -> rs.getObject("id", UUID.class), email).stream().findFirst().orElse(null);
        boolean created = userId == null;
        if (created) {
            userId = UUID.randomUUID();
            jdbc.update(
                    "INSERT INTO iam.user_account (id, email, display_name, status, password_hash, mfa_enabled) "
                            + "VALUES (?, ?, ?, 'ACTIVE', ?, false)",
                    userId, email, displayName, passwordEncoder.encode(password));
        }

        int added = 0;
        for (String code : roleCodes) {
            UUID roleId = jdbc.query("SELECT id FROM iam.role WHERE code = ?",
                    (rs, i) -> rs.getObject("id", UUID.class), code).stream().findFirst().orElse(null);
            if (roleId == null) {
                LOG.warn("Amorçage : rôle {} introuvable dans iam.role, ignoré.", code);
                continue;
            }
            Integer already = jdbc.queryForObject(
                    "SELECT count(*) FROM iam.user_role WHERE user_id = ? AND role_id = ?",
                    Integer.class, userId, roleId);
            if (already == null || already == 0) {
                jdbc.update(
                        "INSERT INTO iam.user_role (id, user_id, role_id, scope_type) VALUES (?, ?, ?, 'GLOBAL')",
                        UUID.randomUUID(), userId, roleId);
                added++;
            }
        }

        LOG.info("Amorçage : compte {} {} ; {} rôle(s) ajouté(s) parmi {} (2FA à enrôler si nouveau).",
                email, created ? "créé" : "déjà présent", added, roleCodes);
    }
}
