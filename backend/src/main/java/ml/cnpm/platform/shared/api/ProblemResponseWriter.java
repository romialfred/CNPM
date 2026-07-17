package ml.cnpm.platform.shared.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/**
 * Écrit une réponse d'erreur normalisée {@link ProblemResponse} directement dans la
 * réponse HTTP.
 *
 * <p>Les erreurs d'authentification et d'autorisation sont produites par des filtres
 * Spring Security, en amont des {@code @ControllerAdvice} : elles doivent donc être
 * sérialisées à la main pour rester au format {@code Problem} du contrat, avec un
 * {@code correlationId}. Le message reste générique — jamais de détail technique, de
 * trace ni de secret, conformément à {@code docs/04-api/error-catalog.md}.
 */
@Component
public class ProblemResponseWriter {

    /** En-tête de corrélation du contrat OpenAPI. */
    public static final String CORRELATION_HEADER = "X-Correlation-Id";

    private final ObjectMapper objectMapper;

    public ProblemResponseWriter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void write(
            HttpServletRequest request,
            HttpServletResponse response,
            int status,
            String code,
            String message)
            throws IOException {
        UUID correlationId = correlationId(request);
        ProblemResponse body =
                new ProblemResponse(Instant.now(), status, code, message, List.of(), correlationId);
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader(CORRELATION_HEADER, correlationId.toString());
        objectMapper.writeValue(response.getWriter(), body);
    }

    /**
     * Réutilise le {@code correlationId} fourni par l'appelant, ou en génère un.
     *
     * <p>Le contrat déclare l'en-tête optionnel en entrée mais {@code correlationId}
     * obligatoire en sortie : le serveur doit donc toujours en produire un, même
     * quand le client n'en envoie pas.
     */
    private UUID correlationId(HttpServletRequest request) {
        String provided = request.getHeader(CORRELATION_HEADER);
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
