package ml.cnpm.platform.shared.security.credential;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;

/**
 * Compose le sujet, le corps HTML et le lien des e-mails de compte. Logique PURE (aucune
 * dépendance d'infrastructure) pour rester testable sans relais SMTP.
 *
 * <p>Le lien pointe vers les écrans publics du portail qui laissent le titulaire poser son
 * propre mot de passe : {@code /auth/activate} pour une première mise en service (message de
 * bienvenue), {@code /auth/reset-password} pour une récupération d'accès. Le jeton voyage en
 * paramètre {@code token}, tel que le lit {@code set-password.page}.
 *
 * <p>Charte CNPM : surface blanche, bleu de marque {@code #273481}, aucune ombre lourde ;
 * un unique bouton d'action. Tout texte injecté (nom d'affichage) est échappé.
 */
final class CredentialEmailComposer {

    private static final String BRAND_BLUE = "#273481";
    private static final String TEXT = "#1f2430";
    private static final String MUTED = "#5b6472";
    private static final String BORDER = "#e3e6ec";

    private final CnpmMailProperties properties;

    CredentialEmailComposer(CnpmMailProperties properties) {
        this.properties = properties;
    }

    /** Message prêt à envoyer. */
    record Message(String subject, String htmlBody, String link) {}

    Message compose(String displayName, boolean activation, String token, OffsetDateTime expiresAt) {
        String link =
                properties.baseUrl()
                        + (activation ? "/auth/activate" : "/auth/reset-password")
                        + "?token="
                        + URLEncoder.encode(token == null ? "" : token, StandardCharsets.UTF_8);
        String subject =
                activation
                        ? "Bienvenue sur la plateforme CNPM — activez votre compte"
                        : "CNPM — réinitialisation de votre mot de passe";
        return new Message(subject, html(displayName, activation, link), link);
    }

    private String html(String displayName, boolean activation, String link) {
        String greetingName = displayName == null || displayName.isBlank() ? "" : " " + escape(displayName.trim());
        String title = activation ? "Bienvenue au Conseil National du Patronat du Mali" : "Réinitialisation de votre mot de passe";
        String intro =
                activation
                        ? "Votre compte sur la plateforme numérique du CNPM vient d'être créé. "
                                + "Pour l'activer, définissez votre mot de passe personnel en cliquant sur le bouton ci-dessous."
                        : "Une réinitialisation de votre mot de passe a été demandée. "
                                + "Choisissez un nouveau mot de passe en cliquant sur le bouton ci-dessous.";
        String cta = activation ? "Activer mon compte" : "Réinitialiser mon mot de passe";
        String security =
                activation
                        ? "Ce lien est personnel et valable 24 heures. Le CNPM ne connaît jamais votre mot de passe : "
                                + "vous seul le définissez. Si vous n'êtes pas à l'origine de cette création, ignorez cet e-mail."
                        : "Ce lien est personnel et valable 24 heures. Si vous n'êtes pas à l'origine de cette demande, "
                                + "ignorez cet e-mail : votre mot de passe actuel reste inchangé.";

        return "<!doctype html><html lang=\"fr\"><head><meta charset=\"utf-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"></head>"
                + "<body style=\"margin:0;padding:0;background:#f4f5f8;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f4f5f8;padding:24px 0;\">"
                + "<tr><td align=\"center\">"
                + "<table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"width:600px;max-width:92%;background:#ffffff;border:1px solid " + BORDER + ";border-radius:12px;overflow:hidden;"
                + "font-family:Arial,Helvetica,sans-serif;\">"
                // Bandeau de marque
                + "<tr><td style=\"background:" + BRAND_BLUE + ";padding:20px 32px;\">"
                + "<span style=\"color:#ffffff;font-size:18px;font-weight:600;letter-spacing:0.02em;\">CNPM</span>"
                + "<span style=\"color:#c9cfe8;font-size:13px;\"> &nbsp;Conseil National du Patronat du Mali</span>"
                + "</td></tr>"
                // Corps
                + "<tr><td style=\"padding:32px;\">"
                + "<h1 style=\"margin:0 0 16px;color:" + TEXT + ";font-size:20px;font-weight:600;\">" + title + "</h1>"
                + "<p style=\"margin:0 0 12px;color:" + TEXT + ";font-size:15px;line-height:22px;\">Bonjour" + greetingName + ",</p>"
                + "<p style=\"margin:0 0 24px;color:" + TEXT + ";font-size:15px;line-height:22px;\">" + intro + "</p>"
                + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 0 24px;\"><tr><td "
                + "style=\"border-radius:8px;background:" + BRAND_BLUE + ";\">"
                + "<a href=\"" + link + "\" style=\"display:inline-block;padding:12px 24px;color:#ffffff;font-size:15px;"
                + "font-weight:600;text-decoration:none;border-radius:8px;\">" + cta + "</a>"
                + "</td></tr></table>"
                + "<p style=\"margin:0 0 8px;color:" + MUTED + ";font-size:13px;line-height:20px;\">"
                + "Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>"
                + "<p style=\"margin:0 0 24px;font-size:13px;line-height:20px;word-break:break-all;\">"
                + "<a href=\"" + link + "\" style=\"color:" + BRAND_BLUE + ";\">" + link + "</a></p>"
                + "<p style=\"margin:0;color:" + MUTED + ";font-size:13px;line-height:20px;\">" + security + "</p>"
                + "</td></tr>"
                // Pied
                + "<tr><td style=\"padding:20px 32px;border-top:1px solid " + BORDER + ";\">"
                + "<p style=\"margin:0;color:" + MUTED + ";font-size:12px;line-height:18px;\">"
                + "CNPM Support Membre — plateforme numérique du Conseil National du Patronat du Mali.<br>"
                + "Cet e-mail vous est envoyé à titre informatif ; merci de ne pas y répondre.</p>"
                + "</td></tr>"
                + "</table></td></tr></table></body></html>";
    }

    /** Échappe le strict nécessaire pour un contexte HTML texte/attribut. */
    private static String escape(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
