package ml.cnpm.platform.member.adapter.in.web;

import java.time.Instant;
import java.util.UUID;
import ml.cnpm.platform.member.domain.MembershipStatusChange;

/**
 * Projection de sortie d'un changement de statut d'adhésion, alignée sur le schéma
 * {@code MembershipStatusChangeView} du contrat.
 */
public record MembershipStatusChangeView(
        UUID id,
        UUID membershipId,
        String membershipNumber,
        String fromStatus,
        String toStatus,
        String reason,
        Instant changedAt,
        UUID changedBy) {

    static MembershipStatusChangeView from(MembershipStatusChange change) {
        return new MembershipStatusChangeView(
                change.id(),
                change.membershipId(),
                change.membershipNumber(),
                change.fromStatus(),
                change.toStatus(),
                change.reason(),
                change.changedAt(),
                change.changedBy());
    }
}
