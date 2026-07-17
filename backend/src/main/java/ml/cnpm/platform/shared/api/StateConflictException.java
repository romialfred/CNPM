package ml.cnpm.platform.shared.api;

/**
 * Une opération est refusée car l'état courant est incompatible (code contractuel
 * {@code STATE_CONFLICT}, HTTP 409).
 *
 * <p>Exception transverse : les services applicatifs la lèvent sans connaître la couche
 * web, et {@link ApiExceptionHandler} la traduit en réponse {@code Problem}. Le message
 * reste générique — jamais de détail exposant l'état interne.
 */
public class StateConflictException extends RuntimeException {

    public StateConflictException(String message) {
        super(message);
    }
}
