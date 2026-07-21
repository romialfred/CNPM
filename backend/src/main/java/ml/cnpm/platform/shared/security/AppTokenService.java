package ml.cnpm.platform.shared.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

/**
 * Émission du jeton de session APPLICATIF après un second facteur validé (AUTH-DEC-020).
 *
 * <p>Le jeton est signé HS256 avec une clé dérivée de {@code APP_JWT_SECRET} (fail-closed
 * hors dev/test, comme le chiffrement MFA). Il porte le sujet (identifiant de compte), le
 * courriel et les rôles réalm, dans le même vocabulaire que le jeton Keycloak
 * ({@code realm_access.roles}), de sorte que la conversion d'autorités existante puisse le
 * consommer une fois le décodeur natif activé.
 */
@Service
public class AppTokenService {

    private static final Logger LOG = LoggerFactory.getLogger(AppTokenService.class);
    private static final Duration TOKEN_TTL = Duration.ofHours(8);
    private static final String ISSUER = "cnpm-native";

    private final byte[] key;

    public AppTokenService(@Value("${APP_JWT_SECRET:}") String configuredSecret, Environment environment) {
        String material = configuredSecret;
        if (material == null || material.isBlank()) {
            if (!environment.acceptsProfiles(Profiles.of("dev", "test", "local"))) {
                throw new IllegalStateException("APP_JWT_SECRET_REQUIRED");
            }
            byte[] ephemeral = new byte[32];
            new SecureRandom().nextBytes(ephemeral);
            material = Base64.getEncoder().encodeToString(ephemeral);
            LOG.warn("APP_JWT_SECRET absente : clé éphémère non persistante (profil local/test)");
        }
        this.key = sha256(material);
    }

    /** Émet un jeton d'accès pour un compte authentifié à deux facteurs. */
    public String issue(UUID accountId, String email, List<String> roles) {
        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(accountId.toString())
                .issuer(ISSUER)
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plus(TOKEN_TTL)))
                .claim("email", email)
                .claim("realm_access", java.util.Map.of("roles", roles))
                .build();
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        try {
            jwt.sign(new MACSigner(key));
            return jwt.serialize();
        } catch (JOSEException ex) {
            throw new IllegalStateException("APP_JWT_SIGNING_FAILED", ex);
        }
    }

    /** Clé HMAC-SHA256 du jeton applicatif, pour que le resource-server puisse le vérifier. */
    public javax.crypto.SecretKey macKey() {
        return new javax.crypto.spec.SecretKeySpec(key, "HmacSHA256");
    }

    private static byte[] sha256(String material) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(material.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("APP_JWT_UNAVAILABLE", ex);
        }
    }
}
