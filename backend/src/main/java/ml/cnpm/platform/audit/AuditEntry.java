package ml.cnpm.platform.audit;

import java.util.UUID;

/**
 * Événement d'audit métier à consigner (module AUDIT).
 *
 * <p>Toute action sensible produit un événement d'audit corrélé ({@code CLAUDE.md}). Les
 * empreintes avant/après (SHA-256) rendent l'enregistrement inviolable sans exposer la
 * donnée elle-même ; les secrets et charges sensibles n'y figurent jamais.
 *
 * @param actorUserId identifiant de l'acteur, ou {@code null} si non résolu en UUID
 * @param beforeHash empreinte de l'état avant l'action, ou {@code null} à la création
 */
public record AuditEntry(
        String actorType,
        UUID actorUserId,
        String actionCode,
        String entityType,
        UUID entityId,
        String beforeHash,
        String afterHash,
        UUID correlationId) {

    /** Événement produit par un utilisateur authentifié pour une création. */
    public static AuditEntry created(
            UUID actorUserId,
            String actionCode,
            String entityType,
            UUID entityId,
            String afterHash,
            UUID correlationId) {
        return new AuditEntry(
                "USER", actorUserId, actionCode, entityType, entityId, null, afterHash, correlationId);
    }
}
