package ml.cnpm.platform.shared.security.mfa;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TotpServiceTest {

    /** Secret des vecteurs officiels RFC 6238 (SHA1) : ASCII « 12345678901234567890 ». */
    private static final String RFC_SECRET =
            TotpService.encodeBase32("12345678901234567890".getBytes(StandardCharsets.US_ASCII));

    @Test
    @DisplayName("reproduit les vecteurs de test officiels RFC 6238 (SHA1, 6 chiffres)")
    void matchesRfc6238Vectors() {
        // Sans cette conformité, les codes de Microsoft Authenticator ne correspondraient pas.
        assertThat(TotpService.generateCode(RFC_SECRET, 59L / 30)).isEqualTo("287082");
        assertThat(TotpService.generateCode(RFC_SECRET, 1111111109L / 30)).isEqualTo("081804");
        assertThat(TotpService.generateCode(RFC_SECRET, 1234567890L / 30)).isEqualTo("005924");
        assertThat(TotpService.generateCode(RFC_SECRET, 2000000000L / 30)).isEqualTo("279037");
    }

    @Test
    @DisplayName("accepte le code courant (fenêtre ±1 pas) et refuse un code erroné")
    void validatesCurrentCodeAndRejectsWrong() {
        TotpService service = new TotpService(Clock.fixed(Instant.ofEpochSecond(59), ZoneOffset.UTC));
        assertThat(service.validate(RFC_SECRET, "287082")).isGreaterThanOrEqualTo(0);
        assertThat(service.validate(RFC_SECRET, "000000")).isEqualTo(-1);
        assertThat(service.validate(RFC_SECRET, "abc")).isEqualTo(-1);
        assertThat(service.validate(RFC_SECRET, null)).isEqualTo(-1);
    }

    @Test
    @DisplayName("génère un secret Base32 valide et fait un aller-retour d'encodage sans perte")
    void generatesSecretAndRoundTripsBase32() {
        String secret = new TotpService().newSecret();
        assertThat(secret).matches("[A-Z2-7]{32}");

        byte[] bytes = { 0, 1, 2, (byte) 250, (byte) 255, (byte) 128, 64, 32, 16, 8 };
        assertThat(TotpService.decodeBase32(TotpService.encodeBase32(bytes))).isEqualTo(bytes);
    }
}
