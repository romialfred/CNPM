package ml.cnpm.platform.shared.security.credential;

import java.time.OffsetDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Repli lorsque l'envoi d'e-mail est désactivé ({@code cnpm.mail.enabled=false} ou absent).
 * Actif en local et en test, où aucun relais SMTP n'est joignable.
 *
 * <p>N'expédie rien : il journalise seulement que le lien n'a pas été envoyé. Le jeton
 * reste retourné à l'opérateur par l'API, qui le relaie. Le jeton n'est jamais journalisé.
 */
@Component
@ConditionalOnProperty(
        prefix = "cnpm.mail",
        name = "enabled",
        havingValue = "false",
        matchIfMissing = true)
public class LoggingAccountCredentialNotifier implements AccountCredentialNotifier {

    private static final Logger LOG =
            LoggerFactory.getLogger(LoggingAccountCredentialNotifier.class);

    @Override
    public void sendCredentialLink(
            Recipient recipient, boolean activation, String token, OffsetDateTime expiresAt) {
        LOG.info(
                "Envoi d'e-mail désactivé (cnpm.mail.enabled=false) : lien {} non expédié ;"
                        + " l'opérateur relaie le jeton retourné par l'API.",
                activation ? "d'activation" : "de réinitialisation");
    }
}
