package ml.cnpm.platform.shared.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
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
        // Même identifiant que celui posé par le filtre de corrélation et renvoyé sur la
        // réponse : l'erreur et son en-tête ne peuvent pas diverger.
        UUID correlationId = CorrelationId.current(request);
        ProblemResponse body =
                new ProblemResponse(Instant.now(), status, code, message, List.of(), correlationId);
        response.setStatus(status);
        // Le contrat déclare `application/problem+json` pour les réponses d'erreur.
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        // L'encodage doit être posé explicitement : sans lui, le conteneur retombe sur
        // ISO-8859-1 et les messages français ressortent avec des accents cassés
        // (« expirée » → « expir?e »). Le writer ci-dessous suit cet encodage.
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader(CorrelationId.HEADER, correlationId.toString());
        objectMapper.writeValue(response.getWriter(), body);
    }
}
