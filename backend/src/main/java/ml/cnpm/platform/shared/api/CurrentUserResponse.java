package ml.cnpm.platform.shared.api;

import java.util.List;

/**
 * Vue de lecture seule du compte authentifié, distincte de toute entité de persistance.
 *
 * <p>Les permissions sont celles que la chaîne de sécurité a déjà dérivées des rôles
 * de realm via le mapping serveur {@code iam.role_permission}. Le périmètre ABAC n'est
 * pas encore déclaré (ADR-008).
 *
 * <p>{@code mfaEnrolled} et {@code mfaRequired} <strong>reflètent le fournisseur
 * d'identité</strong> (Keycloak, ADR-003) : ils sont lus dans le jeton et valent
 * {@code null} lorsqu'il ne les porte pas. Le serveur n'invente aucune politique de
 * second facteur — les méthodes autorisées et les codes de secours restent portés par
 * UX-DEC-011. Ces champs servent au client à décider s'il faut proposer l'enrôlement,
 * jamais à contourner le contrôle de Keycloak.
 */
public record CurrentUserResponse(
        String subject,
        String username,
        String email,
        String displayName,
        String roleLabel,
        List<String> roles,
        List<String> permissions,
        Boolean mfaEnrolled,
        Boolean mfaRequired) {

    public CurrentUserResponse {
        roles = List.copyOf(roles);
        permissions = List.copyOf(permissions);
    }
}
