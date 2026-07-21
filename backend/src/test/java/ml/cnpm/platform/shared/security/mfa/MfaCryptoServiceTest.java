package ml.cnpm.platform.shared.security.mfa;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class MfaCryptoServiceTest {

    private final MfaCryptoService crypto =
            new MfaCryptoService("clé-de-test-déterministe", new MockEnvironment());

    @Test
    @DisplayName("chiffre puis déchiffre le secret sans perte")
    void encryptsAndDecryptsRoundTrip() {
        String secret = "JBSWY3DPEHPK3PXP";
        String encrypted = crypto.encrypt(secret);

        assertThat(encrypted).startsWith("v1.");
        assertThat(encrypted).doesNotContain(secret);
        assertThat(crypto.decrypt(encrypted)).isEqualTo(secret);
    }

    @Test
    @DisplayName("produit un chiffré différent à chaque appel (IV aléatoire)")
    void usesRandomIvPerEncryption() {
        assertThat(crypto.encrypt("meme-secret")).isNotEqualTo(crypto.encrypt("meme-secret"));
    }

    @Test
    @DisplayName("rejette un chiffré altéré ou de format invalide")
    void rejectsTamperedCiphertext() {
        String encrypted = crypto.encrypt("secret");
        String tampered = encrypted.substring(0, encrypted.length() - 2) + "AA";

        assertThatThrownBy(() -> crypto.decrypt(tampered)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> crypto.decrypt("format-invalide")).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("exige la clé de chiffrement hors profils de développement")
    void requiresKeyOutsideDevProfiles() {
        MockEnvironment production = new MockEnvironment();
        production.setActiveProfiles("prod");
        assertThatThrownBy(() -> new MfaCryptoService("", production))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("MFA_ENCRYPTION_KEY_REQUIRED");
    }
}
