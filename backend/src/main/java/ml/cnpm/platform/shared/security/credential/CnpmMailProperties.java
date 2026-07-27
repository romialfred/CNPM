package ml.cnpm.platform.shared.security.credential;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Paramètres d'expédition des e-mails de compte (activation / réinitialisation).
 *
 * <p>Repris du relais SafeX : {@code mail.data-univers.com} en SSL implicite. Les identifiants
 * SMTP eux-mêmes ne vivent pas ici — ils restent dans {@code spring.mail.*}, alimentés par
 * l'environnement. Ce bloc ne porte que le comportement applicatif : activer l'envoi,
 * l'adresse et le nom d'expéditeur, et la base publique servant à bâtir les liens.
 */
@ConfigurationProperties(prefix = "cnpm.mail")
public record CnpmMailProperties(boolean enabled, String from, String fromName, String baseUrl) {

    public CnpmMailProperties {
        from = blankTo(from, "no-reply@data-univers.com");
        fromName = blankTo(fromName, "CNPM Support Membre");
        baseUrl = stripTrailingSlash(blankTo(baseUrl, "https://cnpm.data-univers.com"));
    }

    private static String blankTo(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private static String stripTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
