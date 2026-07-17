package ml.cnpm.platform.shared.security;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Traduit les rôles de realm Keycloak d'un jeton en autorités Spring Security.
 *
 * <p>Keycloak place les rôles de realm dans la revendication {@code realm_access.roles}.
 * Le convertisseur par défaut de Spring lit les {@code scope}, pas ces rôles : sans
 * ce convertisseur, un utilisateur authentifié n'obtiendrait aucune autorité et le
 * RBAC de {@code docs/05-security/rbac-matrix.md} serait inapplicable.
 *
 * <p>Chaque rôle devient une autorité préfixée {@code ROLE_}, forme attendue par
 * {@code hasRole(...)} et les annotations {@code @PreAuthorize}. Aucune autorité
 * n'est dérivée d'un profil technique : seuls les rôles réellement présents dans le
 * jeton sont accordés (refus par défaut).
 */
public final class KeycloakRealmRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    private static final String REALM_ACCESS = "realm_access";
    private static final String ROLES = "roles";
    private static final String ROLE_PREFIX = "ROLE_";

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Object realmAccess = jwt.getClaims().get(REALM_ACCESS);
        if (!(realmAccess instanceof Map<?, ?> claim)) {
            return List.of();
        }
        Object roles = claim.get(ROLES);
        if (!(roles instanceof Collection<?> roleValues)) {
            return List.of();
        }
        return roleValues.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .map(role -> (GrantedAuthority) new SimpleGrantedAuthority(ROLE_PREFIX + role))
                .toList();
    }
}
