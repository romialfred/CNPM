package ml.cnpm.platform.member;

import java.util.UUID;

/**
 * API publique du module MEMBER : activation d'un membre.
 *
 * <p>C'est le <strong>seul</strong> point par lequel un autre module (ENROLLMENT, à
 * l'approbation d'un dossier) fait créer une adhésion : {@code modules.md} interdit à un
 * module de lire ou d'écrire les tables d'un autre. L'interface est déclarée au package
 * racine du module — sa surface exposée — tandis que l'implémentation reste interne, sur le
 * modèle de {@code AuditRecorder} dans le module AUDIT.
 *
 * <p>La surface est volontairement minimale : elle ne rend que l'identifiant de l'adhésion
 * créée, le modèle de domaine de MEMBER n'ayant pas à franchir la frontière.
 */
public interface MemberActivation {

    /**
     * Crée l'adhésion active de l'entreprise et consigne sa transition initiale.
     *
     * <p>Idempotent par numéro d'adhésion ; refuse une seconde adhésion active pour la même
     * personnalité juridique (RG-002). La catégorie et le numéro sont fournis par le décideur
     * tant que le barème (DEC-008) et la règle de numérotation ne sont pas arrêtés.
     *
     * @return l'identifiant technique de l'adhésion active
     * @throws ml.cnpm.platform.shared.api.StateConflictException si l'entreprise a déjà un
     *     compte actif, ou si le numéro est pris par une adhésion différente
     */
    UUID activate(
            UUID organizationId,
            String membershipNumber,
            String categoryCode,
            String reason,
            UUID actorUserId,
            UUID correlationId);
}
