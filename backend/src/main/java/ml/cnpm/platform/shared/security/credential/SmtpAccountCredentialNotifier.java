package ml.cnpm.platform.shared.security.credential;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import java.time.OffsetDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

/**
 * Envoi réel des liens de compte par SMTP (relais SafeX : {@code mail.data-univers.com} en
 * SSL implicite). Actif seulement lorsque {@code cnpm.mail.enabled=true} et que des
 * identifiants sont fournis par l'environnement.
 *
 * <p>Nom d'expéditeur affiché : « CNPM Support Membre » (paramétrable). Un échec d'envoi est
 * journalisé mais n'interrompt jamais l'appelant : l'émission du jeton a déjà réussi et le
 * jeton reste retourné à l'opérateur. Ni le jeton ni le lien (qui le contient) ne sont
 * jamais journalisés.
 */
@Component
@ConditionalOnProperty(prefix = "cnpm.mail", name = "enabled", havingValue = "true")
public class SmtpAccountCredentialNotifier implements AccountCredentialNotifier {

    private static final Logger LOG = LoggerFactory.getLogger(SmtpAccountCredentialNotifier.class);

    private final JavaMailSender mailSender;
    private final CnpmMailProperties properties;
    private final CredentialEmailComposer composer;

    public SmtpAccountCredentialNotifier(JavaMailSender mailSender, CnpmMailProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
        this.composer = new CredentialEmailComposer(properties);
    }

    @Override
    public void sendCredentialLink(
            Recipient recipient, boolean activation, String token, OffsetDateTime expiresAt) {
        if (recipient == null || recipient.email() == null || recipient.email().isBlank()) {
            LOG.warn("Envoi d'e-mail ignoré : destinataire sans adresse.");
            return;
        }
        CredentialEmailComposer.Message message =
                composer.compose(recipient.displayName(), activation, token, expiresAt);
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, false, "UTF-8");
            helper.setFrom(new InternetAddress(properties.from(), properties.fromName(), "UTF-8"));
            helper.setTo(recipient.email().trim());
            helper.setSubject(message.subject());
            helper.setText(message.htmlBody(), true);
            mailSender.send(mime);
            LOG.info("E-mail {} envoyé au titulaire du compte.", activation ? "d'activation" : "de réinitialisation");
        } catch (jakarta.mail.MessagingException | UnsupportedEncodingException | MailException ex) {
            LOG.error(
                    "Échec d'envoi de l'e-mail {} : {}. Le jeton reste disponible pour un relais manuel.",
                    activation ? "d'activation" : "de réinitialisation",
                    ex.getMessage());
        }
    }
}
