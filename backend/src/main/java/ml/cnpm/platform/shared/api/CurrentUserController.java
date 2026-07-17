package ml.cnpm.platform.shared.api;

import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expose l'identité, les rôles et le périmètre de l'utilisateur courant
 * (contrat {@code getCurrentUser}, {@code GET /auth/me}).
 *
 * <p>Le contrôleur ne porte aucune logique métier : il projette les revendications
 * du jeton déjà validé par la chaîne de sécurité. L'accès est implicitement
 * authentifié — la règle « refus par défaut » de {@link ml.cnpm.platform.shared.security.SecurityConfig}
 * rejette toute requête sans jeton avant d'atteindre cette méthode.
 */
@RestController
public class CurrentUserController {

    private static final String ROLE_PREFIX = "ROLE_";

    @GetMapping("/auth/me")
    public CurrentUser currentUser(JwtAuthenticationToken authentication) {
        Jwt jwt = authentication.getToken();
        List<String> roles =
                authentication.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .filter(authority -> authority.startsWith(ROLE_PREFIX))
                        .map(authority -> authority.substring(ROLE_PREFIX.length()))
                        .sorted()
                        .toList();
        return new CurrentUser(
                jwt.getSubject(),
                jwt.getClaimAsString("preferred_username"),
                jwt.getClaimAsString("email"),
                roles);
    }

    /** Vue de lecture seule ; distincte de toute entité de persistance. */
    public record CurrentUser(String subject, String username, String email, List<String> roles) {}
}
