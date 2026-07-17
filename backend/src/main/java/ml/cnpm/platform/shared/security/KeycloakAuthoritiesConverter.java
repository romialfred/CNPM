package ml.cnpm.platform.shared.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Autorités d'un jeton : les rôles de realm ({@code ROLE_*}) et les permissions qu'ils
 * accordent ({@code PERM_*}).
 *
 * <p>Les rôles restent exposés — {@code CurrentUserController} et les écrans les
 * consomment — mais l'autorisation fine des cas d'usage s'appuie sur les permissions
 * dérivées, ce qui évite d'énumérer des dizaines de rôles dans chaque
 * {@code @PreAuthorize}. Aucune permission n'est inventée : elles proviennent
 * exclusivement du mapping {@code iam.role_permission} chargé par {@link PermissionDirectory}.
 */
public final class KeycloakAuthoritiesConverter
        implements Converter<Jwt, Collection<GrantedAuthority>> {

    /** Préfixe des autorités de permission, distinct de {@code ROLE_}. */
    public static final String PERMISSION_PREFIX = "PERM_";

    private static final String ROLE_PREFIX = "ROLE_";

    private final KeycloakRealmRoleConverter roleConverter = new KeycloakRealmRoleConverter();
    private final PermissionDirectory permissions;

    public KeycloakAuthoritiesConverter(PermissionDirectory permissions) {
        this.permissions = permissions;
    }

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Collection<GrantedAuthority> roleAuthorities = roleConverter.convert(jwt);
        Set<String> roleCodes =
                roleAuthorities.stream()
                        .map(GrantedAuthority::getAuthority)
                        .filter(authority -> authority.startsWith(ROLE_PREFIX))
                        .map(authority -> authority.substring(ROLE_PREFIX.length()))
                        .collect(Collectors.toSet());

        List<GrantedAuthority> authorities = new ArrayList<>(roleAuthorities);
        for (String permission : permissions.permissionsFor(roleCodes)) {
            authorities.add(new SimpleGrantedAuthority(PERMISSION_PREFIX + permission));
        }
        return authorities;
    }
}
