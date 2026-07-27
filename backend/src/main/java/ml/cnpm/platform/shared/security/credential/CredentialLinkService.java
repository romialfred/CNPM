package ml.cnpm.platform.shared.security.credential;

import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Émet un lien de compte ET l'expédie à son titulaire.
 *
 * <p>Compose deux responsabilités déjà séparées : {@link AccountCredentialService#issue}
 * produit le jeton (autorisation, transaction et audit portés là), puis le
 * {@link AccountCredentialNotifier} l'envoie. L'envoi a lieu APRÈS l'émission (jeton déjà
 * committé) et n'est jamais bloquant : un échec de notification laisse le jeton disponible
 * pour un relais manuel par l'opérateur — l'API le retourne toujours.
 */
@Service
public class CredentialLinkService {

    private static final Logger LOG = LoggerFactory.getLogger(CredentialLinkService.class);

    private final AccountCredentialService credentials;
    private final AccountCredentialNotifier notifier;
    private final JdbcTemplate jdbc;

    CredentialLinkService(
            AccountCredentialService credentials,
            AccountCredentialNotifier notifier,
            JdbcTemplate jdbc) {
        this.credentials = credentials;
        this.notifier = notifier;
        this.jdbc = jdbc;
    }

    /**
     * Émet le jeton (activation ou réinitialisation) puis notifie le titulaire par e-mail.
     *
     * @return le jeton émis, toujours retourné à l'appelant (repli si l'e-mail échoue)
     */
    public AccountCredentialService.IssuedToken issueAndNotify(
            UUID accountId, UUID actorUserId, UUID correlationId) {
        AccountCredentialService.IssuedToken issued =
                credentials.issue(accountId, actorUserId, correlationId);
        try {
            AccountCredentialNotifier.Recipient recipient =
                    jdbc
                            .query(
                                    "SELECT email, display_name FROM iam.user_account WHERE id = ?",
                                    (rs, i) ->
                                            new AccountCredentialNotifier.Recipient(
                                                    rs.getString("email"), rs.getString("display_name")),
                                    accountId)
                            .stream()
                            .findFirst()
                            .orElse(null);
            if (recipient != null) {
                notifier.sendCredentialLink(
                        recipient, issued.activation(), issued.token(), issued.expiresAt());
            }
        } catch (RuntimeException ex) {
            // L'émission a réussi ; on n'annule rien pour un échec d'expédition. Ni jeton ni
            // lien ne sont journalisés.
            LOG.error(
                    "Notification par e-mail non aboutie ; le jeton reste retourné à l'opérateur : {}",
                    ex.getMessage());
        }
        return issued;
    }
}
