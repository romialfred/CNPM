package ml.cnpm.platform.shared.api;

/**
 * La ressource visée n'existe pas (code contractuel {@code RESOURCE_NOT_FOUND}, HTTP 404).
 *
 * <p>Exception transverse levée par les services applicatifs ; {@link ApiExceptionHandler}
 * la traduit en réponse {@code Problem}. Le message reste générique — il ne confirme ni
 * n'infirme l'existence d'un identifiant voisin.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
