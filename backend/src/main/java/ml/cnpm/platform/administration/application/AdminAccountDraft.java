package ml.cnpm.platform.administration.application;

import java.util.UUID;

/**
 * Compte à créer.
 *
 * <p>Aucun mot de passe n'y figure : l'accès s'établit à la première connexion, où le
 * second facteur est enrôlé (AUTH-007). Un compte {@code MEMBER} désigne une adhésion,
 * un compte {@code PROFESSIONAL} n'en désigne aucune — l'invariant est tenu par la base
 * ({@code ck_iam_user_account_member_link}) autant que par le service.
 *
 * @param memberId adhésion désignée pour un compte MEMBER, {@code null} sinon
 */
public record AdminAccountDraft(
        String accountType,
        String firstName,
        String lastName,
        String email,
        String phone,
        String jobTitle,
        String organization,
        String department,
        UUID roleId,
        UUID memberId) {

    public static final String TYPE_PROFESSIONAL = "PROFESSIONAL";
    public static final String TYPE_MEMBER = "MEMBER";

    /** Nom affiché, dérivé de l'identité : le stockage garde les deux parties séparées. */
    public String displayName() {
        return (firstName.trim() + " " + lastName.trim()).trim();
    }

    /** Adresse normalisée : l'unicité des comptes ne doit pas dépendre de la casse saisie. */
    public String normalizedEmail() {
        return email.trim().toLowerCase(java.util.Locale.ROOT);
    }
}
