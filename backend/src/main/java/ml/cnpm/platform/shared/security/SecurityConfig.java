package ml.cnpm.platform.shared.security;

import java.util.UUID;
import ml.cnpm.platform.audit.SecurityEvent;
import ml.cnpm.platform.audit.SecurityEventRecorder;
import ml.cnpm.platform.shared.api.ProblemResponseWriter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
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
        "/receipts/verify/**"
    };

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            ProblemResponseWriter problems,
            SecurityEventRecorder securityEvents)
            throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
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
                                                        jwtAuthenticationConverter())))
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

    /** Associe la conversion des rôles de realm Keycloak au décodage du jeton. */
    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new KeycloakRealmRoleConverter());
        return converter;
    }
}
