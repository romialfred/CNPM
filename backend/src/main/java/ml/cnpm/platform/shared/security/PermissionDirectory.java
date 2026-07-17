package ml.cnpm.platform.shared.security;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Correspondance rôle → permissions, chargée depuis {@code iam.role_permission}.
 *
 * <p>Une permission métier comme {@code MEMBER.READ} est portée par une dizaine de
 * rôles ; coder cette liste en dur dans chaque {@code @PreAuthorize} couplerait le code
 * aux données de seed et deviendrait ingérable. Ce répertoire dérive les permissions des
 * rôles du jeton, ce qui permet d'autoriser par <em>permission</em> plutôt que par une
 * énumération fragile de rôles.
 *
 * <p>Le mapping est une donnée de configuration quasi statique : il est chargé une seule
 * fois, paresseusement (au premier appel, donc après que Flyway a migré la base), et
 * conservé en mémoire. Un changement de seed suppose de toute façon un redéploiement.
 */
@Component
public class PermissionDirectory {

    private final JdbcTemplate jdbcTemplate;
    private volatile Map<String, Set<String>> permissionsByRole;

    PermissionDirectory(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** Union des permissions accordées à l'ensemble des rôles fournis. */
    public Set<String> permissionsFor(Set<String> roleCodes) {
        Map<String, Set<String>> mapping = mapping();
        return roleCodes.stream()
                .flatMap(role -> mapping.getOrDefault(role, Set.of()).stream())
                .collect(Collectors.toUnmodifiableSet());
    }

    private Map<String, Set<String>> mapping() {
        Map<String, Set<String>> current = permissionsByRole;
        if (current == null) {
            synchronized (this) {
                if (permissionsByRole == null) {
                    permissionsByRole = load();
                }
                current = permissionsByRole;
            }
        }
        return current;
    }

    private Map<String, Set<String>> load() {
        Map<String, Set<String>> mapping = new HashMap<>();
        jdbcTemplate.query(
                "SELECT r.code AS role_code, p.code AS permission_code "
                        + "FROM iam.role_permission rp "
                        + "JOIN iam.role r ON r.id = rp.role_id "
                        + "JOIN iam.permission p ON p.id = rp.permission_id",
                (java.sql.ResultSet rs) -> {
                    mapping
                            .computeIfAbsent(rs.getString("role_code"), key -> new HashSet<>())
                            .add(rs.getString("permission_code"));
                });
        return mapping;
    }
}
