package ml.cnpm.platform.payment.application;

import java.util.List;

/**
 * Projection de lecture des références de paiement pour l'écran de la CNPM.
 *
 * <p>Le nom de l'entreprise et le numéro d'adhésion proviennent de la vue
 * {@code member.membership_list} — surface de lecture transverse autorisée — afin que l'agent
 * identifie le cotisant sans que le module Paiement ne lise les tables privées du module Membres.
 */
public final class PaymentReferenceView {

    private PaymentReferenceView() {}

    /**
     * Une référence de paiement.
     *
     * @param status PENDING_VALIDATION (non diffusable), VALIDATED (diffusable) ou REVOKED
     */
    public record Reference(
            String id,
            String membershipId,
            String membershipNumber,
            String organizationName,
            String referenceValue,
            Integer exercise,
            String status,
            String approvedAt,
            String createdAt) {}

    public record ReferenceList(List<Reference> references) {}
}
