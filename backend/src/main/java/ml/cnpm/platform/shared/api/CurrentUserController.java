package ml.cnpm.platform.shared.api;

import java.util.List;
import java.util.Locale;
import java.util.Set;
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

    /** Revendications d'état 2FA fournies par Keycloak ; le serveur ne fait que les lire. */
    private static final String CLAIM_MFA_ENROLLED = "mfa_enrolled";
    private static final String CLAIM_MFA_REQUIRED = "mfa_required";
    private static final String CLAIM_AMR = "amr";

    /**
     * Méthodes {@code amr} (OIDC) qui attestent un second facteur. {@code otp} pour le
     * TOTP Keycloak ; {@code hwk}/{@code swk} pour une clé matérielle/logicielle
     * (WebAuthn). {@code mfa} est la valeur générique de RFC 8176.
     */
    private static final Set<String> SECOND_FACTOR_METHODS = Set.of("otp", "hwk", "swk", "mfa");

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
                permissions,
                mfaEnrolled(jwt),
                booleanClaim(jwt, CLAIM_MFA_REQUIRED));
    }

    /**
     * État d'enrôlement du second facteur, lu dans le jeton, jamais déduit d'une règle
     * CNPM.
     *
     * <p>Ordre de lecture : un booléen explicite {@code mfa_enrolled} l'emporte s'il est
     * présent (mappeur Keycloak dédié) ; à défaut, la revendication OIDC standard
     * {@code amr} contenant une méthode de second facteur (par exemple {@code otp})
     * atteste que la session courante a utilisé un facteur enrôlé. En l'absence des deux,
     * le serveur ne conclut rien et renvoie {@code null} — pas {@code false}, qui
     * affirmerait à tort l'absence d'enrôlement.
     */
    private Boolean mfaEnrolled(Jwt jwt) {
        Boolean explicit = booleanClaim(jwt, CLAIM_MFA_ENROLLED);
        if (explicit != null) {
            return explicit;
        }
        Object amr = jwt.getClaim(CLAIM_AMR);
        if (amr instanceof List<?> methods) {
            boolean usedSecondFactor = methods.stream()
                    .map(String::valueOf)
                    .map(method -> method.toLowerCase(Locale.ROOT))
                    .anyMatch(SECOND_FACTOR_METHODS::contains);
            if (usedSecondFactor) {
                return Boolean.TRUE;
            }
        }
        return null;
    }

    private Boolean booleanClaim(Jwt jwt, String claim) {
        Object value = jwt.getClaim(claim);
        if (value instanceof Boolean bool) {
            return bool;
        }
        return null;
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
