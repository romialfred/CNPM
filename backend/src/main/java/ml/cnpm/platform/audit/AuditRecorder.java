package ml.cnpm.platform.audit;

/**
 * Point d'entrée du module AUDIT : consigne un événement dans le journal inviolable.
 *
 * <p>L'enregistrement participe à la transaction de l'appelant : si l'action métier est
 * annulée, son événement d'audit l'est aussi, et inversement. Le journal
 * {@code audit.audit_event} est en ajout seul (protégé par V4/V5) — un événement écrit
 * ne peut plus être modifié ni supprimé.
 */
public interface AuditRecorder {

    void record(AuditEntry entry);
}
