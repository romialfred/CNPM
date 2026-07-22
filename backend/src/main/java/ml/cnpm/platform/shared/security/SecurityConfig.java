package ml.cnpm.platform.shared.security;

import java.util.List;
import java.util.UUID;
import ml.cnpm.platform.audit.SecurityEvent;
import ml.cnpm.platform.audit.SecurityEventRecorder;
import ml.cnpm.platform.shared.api.ProblemResponseWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Politique de sécurité HTTP du monolithe.
 *
 * <p>Applique le refus par défaut exigé par {@code docs/05-security/security-architecture.md} :
 * toute requête non explicitement ouverte requiert un jeton valide. L'API est sans
 * session (jetons portés à chaque appel) ; CSRF est donc désactivé, ce qui est correct
 * pour une API stateless consommée par jeton, et non par cookie de session.
 *
 * <p>Les erreurs 401/403 sont rendues au format {@code Problem} du contrat, avec un
 * {@code correlationId}, plutôt que via les pages par défaut du conteneur.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    /**
     * Endpoints réellement publics. Toute autre route est refusée par défaut.
     *
     * <p>Seules les sondes de liveness/readiness sont ouvertes : elles ne portent
     * aucune donnée sensible. {@code /actuator/prometheus} en est délibérément exclu
     * — exposer les métriques internes sans authentification facilite la
     * reconnaissance ; leur collecte passe par un accès authentifié ou un port de
     * gestion isolé par politique réseau.
     */
    private static final String[] PUBLIC_ENDPOINTS = {
        "/actuator/health",
        "/actuator/health/**",
        "/actuator/info",
        // Vérification publique d'un reçu par jeton opaque (docs/04-api : verifyReceipt).
        "/receipts/verify/**",
        // Chiffres clés publics de l'accueil (PUB-001) : dénombrements agrégés, non nominatifs.
        "/public/highlights",
        // Authentification NATIVE (AUTH-DEC-020) : ces routes établissent l'identité, elles
        // ne peuvent donc pas exiger un jeton préalable. Le mot de passe et le second facteur
        // y sont vérifiés ; l'accès aux autres routes reste refusé par défaut. /auth/me, lui,
        // reste protégé (il projette une identité déjà authentifiée).
        "/auth/login",
        "/auth/mfa/**"
    };

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            ProblemResponseWriter problems,
            SecurityEventRecorder securityEvents,
            JwtAuthenticationConverter jwtAuthenticationConverter)
            throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                // CORS piloté par cnpm.web.cors.allowed-origins (voir corsConfigurationSource) :
                // sans origine configurée, aucune règle n'est posée et le comportement local est
                // inchangé. En production, le front est servi depuis une origine distincte
                // (site statique) et doit être explicitement autorisé.
                .cors(Customizer.withDefaults())
                .sessionManagement(
                        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(
                        registry ->
                                registry
                                        .requestMatchers(PUBLIC_ENDPOINTS)
                                        .permitAll()
                                        .anyRequest()
                                        .authenticated())
                .oauth2ResourceServer(
                        oauth2 ->
                                oauth2.jwt(
                                        jwt ->
                                                jwt.jwtAuthenticationConverter(
                                                        jwtAuthenticationConverter)))
                .exceptionHandling(
                        handling ->
                                handling
                                        .authenticationEntryPoint(
                                                (request, response, ex) ->
                                                        problems.write(
                                                                request,
                                                                response,
                                                                HttpStatus.UNAUTHORIZED.value(),
                                                                "AUTHENTICATION_REQUIRED",
                                                                "Authentification absente ou expirée."))
                                        .accessDeniedHandler(
                                                (request, response, ex) -> {
                                                    // Un refus d'autorisation est une tentative de dépassement
                                                    // de droits par un utilisateur authentifié : on la trace.
                                                    // Le 401 anonyme n'est volontairement pas audité (volume et
                                                    // signal faibles). Best-effort : une panne d'audit ne doit
                                                    // pas empêcher le refus d'être renvoyé.
                                                    recordDenial(securityEvents);
                                                    problems.write(
                                                            request,
                                                            response,
                                                            HttpStatus.FORBIDDEN.value(),
                                                            "FORBIDDEN",
                                                            "Permission ou périmètre insuffisant.");
                                                }));
        return http.build();
    }

    /**
     * Source CORS de l'API stateless.
     *
     * <p>Vide par défaut (dev, test) : aucune règle enregistrée, donc aucun en-tête CORS et
     * comportement identique à l'existant. En production, {@code cnpm.web.cors.allowed-origins}
     * (variable {@code CNPM_WEB_CORS_ALLOWED_ORIGINS}, valeurs séparées par des virgules)
     * autorise l'origine du front. Les jetons sont portés par l'en-tête {@code Authorization}
     * (aucun cookie), on n'active donc pas {@code allowCredentials}.
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${cnpm.web.cors.allowed-origins:}") List<String> allowedOrigins) {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        List<String> origins =
                allowedOrigins.stream().map(String::trim).filter(o -> !o.isBlank()).toList();
        if (!origins.isEmpty()) {
            CorsConfiguration config = new CorsConfiguration();
            // Patterns (et non origines exactes) : tolère un sous-domaine attribué par
            // l'hébergeur (ex. suffixe Render) sans rouvrir à tout le monde.
            config.setAllowedOriginPatterns(origins);
            config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
            config.setAllowedHeaders(
                    List.of("Authorization", "Content-Type", "X-Correlation-Id", "Idempotency-Key"));
            config.setExposedHeaders(List.of("X-Correlation-Id"));
            config.setMaxAge(3600L);
            source.registerCorsConfiguration("/**", config);
        }
        return source;
    }

    private static void recordDenial(SecurityEventRecorder securityEvents) {
        try {
            securityEvents.record(SecurityEvent.authorizationDenied(currentSubject()));
        } catch (RuntimeException auditFailure) {
            // Ne jamais laisser une panne d'audit masquer le refus lui-même.
            log.warn("Échec de journalisation d'un refus d'autorisation", auditFailure);
        }
    }

    /** Sujet du jeton courant en UUID (cas Keycloak), ou {@code null}. */
    private static UUID currentSubject() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException notAUuid) {
            return null;
        }
    }

    /**
     * Associe au décodage du jeton la conversion des rôles de realm et la dérivation des
     * permissions qu'ils accordent — l'autorisation fine s'appuie ensuite sur les
     * permissions (voir {@link KeycloakAuthoritiesConverter}).
     */
    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter(PermissionDirectory permissions) {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new KeycloakAuthoritiesConverter(permissions));
        return converter;
    }
}
