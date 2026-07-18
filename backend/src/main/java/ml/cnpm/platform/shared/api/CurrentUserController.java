package ml.cnpm.platform.shared.api;

import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expose l'identité, les rôles et les permissions de l'utilisateur courant
 * (contrat {@code getCurrentUser}, {@code GET /auth/me}).
 *
 * <p>Le contrôleur ne porte aucune logique métier : il projette les revendications
 * du jeton et les autorités déjà validées et dérivées par la chaîne de sécurité.
 * L'accès est implicitement authentifié — la règle « refus par défaut » de
 * {@link ml.cnpm.platform.shared.security.SecurityConfig} rejette toute requête sans
 * jeton avant d'atteindre cette méthode.
 */
@RestController
public class CurrentUserController {

    private static final String ROLE_PREFIX = "ROLE_";
    private static final String PERMISSION_PREFIX = "PERM_";

    @GetMapping("/auth/me")
    public CurrentUserResponse currentUser(JwtAuthenticationToken authentication) {
        Jwt jwt = authentication.getToken();
        List<String> roles = authoritiesWithPrefix(authentication, ROLE_PREFIX);
        List<String> permissions = authoritiesWithPrefix(authentication, PERMISSION_PREFIX);
        return new CurrentUserResponse(
                jwt.getSubject(),
                jwt.getClaimAsString("preferred_username"),
                jwt.getClaimAsString("email"),
                roles,
                permissions);
    }

    private List<String> authoritiesWithPrefix(
            JwtAuthenticationToken authentication, String prefix) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith(prefix))
                .map(authority -> authority.substring(prefix.length()))
                .filter(authority -> !authority.isBlank())
                .distinct()
                .sorted()
                .toList();
    }
}
