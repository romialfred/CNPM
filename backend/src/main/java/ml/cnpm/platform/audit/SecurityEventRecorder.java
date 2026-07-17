package ml.cnpm.platform.audit;

/**
 * Consigne un événement de sécurité dans {@code audit.security_event} (append-only).
 *
 * <p>Consommé notamment par la chaîne de sécurité sur un refus d'autorisation. La
 * consignation est indépendante de toute transaction métier — un refus survient avant
 * qu'aucune transaction applicative ne démarre.
 */
public interface SecurityEventRecorder {

    void record(SecurityEvent event);
}
