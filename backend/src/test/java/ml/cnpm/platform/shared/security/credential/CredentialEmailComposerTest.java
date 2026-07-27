package ml.cnpm.platform.shared.security.credential;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;

/** Vérifie la construction du lien, du sujet et l'échappement du corps HTML. */
class CredentialEmailComposerTest {

    private static final OffsetDateTime EXPIRES = OffsetDateTime.parse("2026-01-01T00:00:00Z");

    private CredentialEmailComposer composer(String baseUrl) {
        return new CredentialEmailComposer(
                new CnpmMailProperties(true, "no-reply@data-univers.com", "CNPM Support Membre", baseUrl));
    }

    @Test
    void activation_pointe_vers_l_ecran_d_activation() {
        CredentialEmailComposer.Message message =
                composer("https://cnpm.data-univers.com").compose("Awa", true, "jeton123", EXPIRES);

        assertThat(message.link())
                .isEqualTo("https://cnpm.data-univers.com/auth/activate?token=jeton123");
        assertThat(message.subject()).contains("Bienvenue");
        assertThat(message.htmlBody()).contains(message.link()).contains("Bonjour Awa,");
    }

    @Test
    void reinitialisation_pointe_vers_l_ecran_de_reinitialisation() {
        CredentialEmailComposer.Message message =
                composer("https://cnpm.data-univers.com").compose("Awa", false, "jeton123", EXPIRES);

        assertThat(message.link())
                .isEqualTo("https://cnpm.data-univers.com/auth/reset-password?token=jeton123");
        assertThat(message.subject()).contains("réinitialisation");
    }

    @Test
    void la_base_url_avec_slash_final_est_normalisee() {
        CredentialEmailComposer.Message message =
                composer("https://cnpm.data-univers.com/").compose("Awa", true, "t", EXPIRES);

        assertThat(message.link()).startsWith("https://cnpm.data-univers.com/auth/activate");
    }

    @Test
    void le_jeton_est_encode_pour_l_url() {
        CredentialEmailComposer.Message message =
                composer("https://x.test").compose("Awa", true, "a b/c", EXPIRES);

        // L'espace et la barre oblique ne doivent pas casser l'URL.
        assertThat(message.link()).isEqualTo("https://x.test/auth/activate?token=a+b%2Fc");
    }

    @Test
    void le_nom_affiche_est_echappe_contre_l_injection_html() {
        CredentialEmailComposer.Message message =
                composer("https://x.test").compose("<b>O'Neil</b>", true, "t", EXPIRES);

        assertThat(message.htmlBody())
                .doesNotContain("<b>O'Neil</b>")
                .contains("&lt;b&gt;O&#39;Neil&lt;/b&gt;");
    }

    @Test
    void le_pied_porte_le_nom_de_l_expediteur() {
        CredentialEmailComposer.Message message =
                composer("https://x.test").compose(null, true, "t", EXPIRES);

        assertThat(message.htmlBody()).contains("CNPM Support Membre").contains("Bonjour,");
    }
}
