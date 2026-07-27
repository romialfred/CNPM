package ml.cnpm.platform.shared.security.credential;

import java.time.OffsetDateTime;

/**
 * Port d'expédition d'un lien de compte au titulaire (activation ou réinitialisation).
 *
 * <p>Séparé de l'émission du jeton : {@link AccountCredentialService} produit le secret,
 * ce port le transporte. Une implémentation SMTP l'envoie réellement ; un repli journalise
 * simplement que l'envoi est désactivé, sans jamais faire échouer l'émission — le jeton
 * reste alors retourné à l'opérateur, qui le relaie.
 *
 * <p>Contrat de sécurité : une implémentation ne journalise JAMAIS le jeton ni le lien (qui
 * le contient), et n'interrompt jamais l'appelant sur un échec d'envoi.
 */
public interface AccountCredentialNotifier {

    /**
     * Envoie au destinataire le lien lui permettant de poser son mot de passe.
     *
     * @param recipient adresse et nom d'affichage du titulaire
     * @param activation vrai pour une première mise en service (e-mail de bienvenue), faux
     *     pour une récupération d'accès
     * @param token jeton en clair à insérer dans le lien ; à ne journaliser nulle part
     * @param expiresAt fin de validité du lien, communiquée au destinataire
     */
    void sendCredentialLink(
            Recipient recipient, boolean activation, String token, OffsetDateTime expiresAt);

    /** Destinataire d'un lien de compte. */
    record Recipient(String email, String displayName) {}
}
