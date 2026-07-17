package ml.cnpm.platform.shared.api;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Empreintes SHA-256 des états, pour la traçabilité d'audit.
 *
 * <p>Le journal stocke une empreinte avant/après plutôt que l'état lui-même : il prouve
 * qu'un enregistrement n'a pas été altéré sans divulguer la donnée. Le SHA-256 produit
 * 64 caractères hexadécimaux, exactement la largeur de {@code before_hash}/{@code after_hash}.
 */
public final class Hashing {

    private Hashing() {}

    public static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 est garanti présent sur toute JVM conforme ; l'absence est un défaut
            // d'installation, pas une condition à gérer par l'appelant.
            throw new IllegalStateException("SHA-256 indisponible", e);
        }
    }
}
