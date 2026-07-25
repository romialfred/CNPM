package ml.cnpm.platform.shared.security.profile;

/**
 * Profil du compte connecté, tel qu'affiché dans l'espace membre.
 *
 * @param avatarDataUri photo de profil encodée en {@code data:} (prête pour un {@code <img>}),
 *     ou {@code null} si aucune photo n'est définie
 */
public record MemberProfileView(
        String displayName,
        String email,
        String organization,
        String jobTitle,
        String phone,
        String avatarDataUri,
        String avatarUpdatedAt) {}
