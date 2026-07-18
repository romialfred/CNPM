package ml.cnpm.platform.shared.api;

import java.util.List;

/**
 * Vue de lecture seule du compte authentifié, distincte de toute entité de persistance.
 *
 * <p>Les permissions sont celles que la chaîne de sécurité a déjà dérivées des rôles
 * de realm via le mapping serveur {@code iam.role_permission}. Cette vue n'invente ni
 * périmètre ABAC, ni état ou niveau MFA.
 */
public record CurrentUserResponse(
        String subject,
        String username,
        String email,
        List<String> roles,
        List<String> permissions) {

    public CurrentUserResponse {
        roles = List.copyOf(roles);
        permissions = List.copyOf(permissions);
    }
}
