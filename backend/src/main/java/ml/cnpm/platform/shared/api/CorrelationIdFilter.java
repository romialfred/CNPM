package ml.cnpm.platform.shared.api;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Pose l'identifiant de corrélation sur chaque requête et l'écho sur chaque réponse.
 *
 * <p>Exécuté avant la chaîne de sécurité (voir {@code SecurityConfig}), il garantit que
 * <em>toute</em> réponse porte {@code X-Correlation-Id} — succès comme erreur — et que
 * l'écrivain d'erreurs et le gestionnaire d'exceptions réutilisent le même identifiant
 * plutôt que d'en recalculer chacun un.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        UUID correlationId = CorrelationId.resolve(request);
        request.setAttribute(CorrelationId.ATTRIBUTE, correlationId);
        response.setHeader(CorrelationId.HEADER, correlationId.toString());
        filterChain.doFilter(request, response);
    }
}
