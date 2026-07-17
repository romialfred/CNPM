package ml.cnpm.platform.member.adapter.in.web;

import java.time.LocalDate;
import java.util.UUID;
import ml.cnpm.platform.member.domain.Membership;

/** Projection de sortie d'une adhésion, alignée sur le schéma {@code MembershipView}. */
public record MembershipView(
        UUID id,
        String membershipNumber,
        UUID organizationId,
        String organizationLegalName,
        String categoryCode,
        String status,
        LocalDate joinedAt,
        long version,
        String primaryGroupCode,
        String primaryGroupName,
        String primaryContactName,
        String primaryContactEmail,
        String primaryContactPhone) {

    static MembershipView from(Membership membership) {
        return new MembershipView(
                membership.id(),
                membership.membershipNumber(),
                membership.organizationId(),
                membership.organizationLegalName(),
                membership.categoryCode(),
                membership.status(),
                membership.joinedAt(),
                membership.version(),
                membership.primaryGroupCode(),
                membership.primaryGroupName(),
                membership.primaryContactName(),
                membership.primaryContactEmail(),
                membership.primaryContactPhone());
    }

    /**
     * Masque les coordonnées personnelles (Confidentiel) en cas de log accidentel. La
     * sérialisation JSON de la réponse passe par les accesseurs, pas par {@code toString()}.
     */
    @Override
    public String toString() {
        return "MembershipView[id=%s, membershipNumber=%s, status=%s, primaryContact=***]"
                .formatted(id, membershipNumber, status);
    }
}
