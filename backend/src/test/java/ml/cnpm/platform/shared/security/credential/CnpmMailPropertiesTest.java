package ml.cnpm.platform.shared.security.credential;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** Valeurs par défaut et normalisation des propriétés d'expédition. */
class CnpmMailPropertiesTest {

    @Test
    void les_valeurs_vides_retombent_sur_les_defauts() {
        CnpmMailProperties props = new CnpmMailProperties(false, "  ", "", null);

        assertThat(props.from()).isEqualTo("no-reply@data-univers.com");
        assertThat(props.fromName()).isEqualTo("CNPM Support Membre");
        assertThat(props.baseUrl()).isEqualTo("https://cnpm.data-univers.com");
    }

    @Test
    void le_slash_final_de_la_base_url_est_retire() {
        CnpmMailProperties props =
                new CnpmMailProperties(true, "x@y.z", "Nom", "https://portail.example/");

        assertThat(props.baseUrl()).isEqualTo("https://portail.example");
    }
}
