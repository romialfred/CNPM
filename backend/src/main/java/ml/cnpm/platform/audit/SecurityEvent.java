package ml.cnpm.platform.audit;

import java.util.UUID;

/**
 * Événement de sécurité à consigner (module AUDIT), distinct de l'audit métier.
 *
 * <p>Sert notamment à tracer les refus d'autorisation : {@code security-architecture.md}
 * exige une trace des tentatives d'élévation de privilège. Aucun secret ni détail
 * technique n'y figure.
 *
 * @param userId acteur concerné, ou {@code null} s'il n'est pas résolu en UUID
 */
public record SecurityEvent(String eventType, String severity, UUID userId) {

    /** Refus d'autorisation d'un utilisateur authentifié (tentative de dépassement de droits). */
    public static SecurityEvent authorizationDenied(UUID userId) {
        return new SecurityEvent("AUTHORIZATION_DENIED", "WARNING", userId);
    }
}
