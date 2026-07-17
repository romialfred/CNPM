package ml.cnpm.platform.member.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Changement de statut d'une adhésion (module MEMBER) — entrée d'historique.
 *
 * <p>Projection de domaine immuable, indépendante de la persistance et de l'API. Portée
 * par la table append-only {@code member.membership_status_history}, elle décrit une
 * transition ({@code fromStatus} → {@code toStatus}) horodatée et attribuée à un acteur.
 * {@code fromStatus} est {@code null} pour le statut initial ; {@code reason} et
 * {@code changedBy} peuvent être absents.
 */
public record MembershipStatusChange(
        UUID id,
        UUID membershipId,
        String membershipNumber,
        String fromStatus,
        String toStatus,
        String reason,
        Instant changedAt,
        UUID changedBy) {}
