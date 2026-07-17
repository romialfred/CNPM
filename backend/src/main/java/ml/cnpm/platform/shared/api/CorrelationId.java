package ml.cnpm.platform.shared.api;

import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;

/**
 * Résolution de l'identifiant de corrélation d'une requête.
 *
 * <p>Le contrat déclare l'en-tête {@code X-Correlation-Id} optionnel en entrée mais le
 * {@code correlationId} obligatoire en sortie : le serveur en produit donc toujours un.
 * Ce point unique évite que le filtre, l'écrivain d'erreurs et le gestionnaire
 * d'exceptions ne divergent sur la façon de le calculer.
 */
public final class CorrelationId {

    /** En-tête de corrélation du contrat OpenAPI. */
    public static final String HEADER = "X-Correlation-Id";

    /** Attribut de requête où le filtre publie l'identifiant résolu. */
    static final String ATTRIBUTE = CorrelationId.class.getName();

    private CorrelationId() {}

    /**
     * Identifiant de la requête courante : celui publié par {@link CorrelationIdFilter}
     * s'il a été posé, sinon résolu à la volée (utile hors chaîne de filtres, en test).
     */
    public static UUID current(HttpServletRequest request) {
        Object attribute = request.getAttribute(ATTRIBUTE);
        return attribute instanceof UUID id ? id : resolve(request);
    }

    /** Réutilise un en-tête bien formé fourni par le client, ou en génère un. */
    static UUID resolve(HttpServletRequest request) {
        String provided = request.getHeader(HEADER);
        if (provided != null && !provided.isBlank()) {
            try {
                return UUID.fromString(provided);
            } catch (IllegalArgumentException ignored) {
                // En-tête mal formé : on en génère un plutôt que de propager une entrée invalide.
            }
        }
        return UUID.randomUUID();
    }
}
