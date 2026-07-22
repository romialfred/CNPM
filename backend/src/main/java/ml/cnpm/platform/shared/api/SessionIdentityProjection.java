package ml.cnpm.platform.shared.api;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Résout, pour l'affichage du shell, le nom lisible et le libellé de rôle du compte courant.
 *
 * <p>Projection d'identité en lecture seule : ni règle métier, ni logique de sécurité. Les
 * libellés proviennent de la source de vérité {@code iam.role.label} ; le nom de
 * {@code iam.user_account.display_name}. Le sujet du jeton natif est l'identifiant de compte
 * (UUID) ; s'il n'est pas un UUID (jeton Keycloak) ou introuvable, on renvoie {@code null} et
 * le client retombe sur le courriel — jamais un libellé inventé.
 */
@Service
public class SessionIdentityProjection {

    /**
     * Rôle propriétaire de la plateforme. Le compte d'amorçage natif porte ce rôle privilégié
     * et est présenté comme « Propriétaire » (désignation owner demandée, AUTH-DEC-022), sans
     * altérer le catalogue {@code iam.role} où {@code SUPER_ADMIN_TECH} reste
     * « Superadministrateur technique » pour tout autre usage.
     */
    private static final String OWNER_ROLE = "SUPER_ADMIN_TECH";
    private static final String OWNER_LABEL = "Propriétaire";
    private static final String NO_ROLE_LABEL = "Aucun rôle attribué";

    private final JdbcTemplate jdbc;

    SessionIdentityProjection(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Identity(String displayName, String roleLabel) { }

    @Transactional(readOnly = true)
    public Identity resolve(String subject, List<String> roleCodes) {
        return new Identity(displayName(subject), roleLabel(roleCodes));
    }

    private String displayName(String subject) {
        UUID accountId;
        try {
            accountId = UUID.fromString(subject);
        } catch (IllegalArgumentException notNativeSubject) {
            return null;
        }
        List<String> names = jdbc.query(
                "SELECT display_name FROM iam.user_account WHERE id = ?",
                (rs, i) -> rs.getString("display_name"),
                accountId);
        String name = names.isEmpty() ? null : names.get(0);
        return name == null || name.isBlank() ? null : name;
    }

    private String roleLabel(List<String> roleCodes) {
        if (roleCodes.isEmpty()) {
            return NO_ROLE_LABEL;
        }
        if (roleCodes.contains(OWNER_ROLE)) {
            return OWNER_LABEL;
        }
        String placeholders = String.join(",", Collections.nCopies(roleCodes.size(), "?"));
        List<String> labels = jdbc.query(
                "SELECT label FROM iam.role WHERE code IN (" + placeholders + ") ORDER BY label",
                (rs, i) -> rs.getString("label"),
                roleCodes.toArray());
        return labels.isEmpty() ? NO_ROLE_LABEL : String.join(" · ", labels);
    }
}
