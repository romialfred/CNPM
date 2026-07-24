package ml.cnpm.platform.payment.application.port.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.payment.application.PaymentReferenceView;

/**
 * Port sortant de persistance des références de paiement, sur le schéma {@code payment}.
 *
 * <p>Les lectures joignent la vue {@code member.membership_list} pour porter le nom du cotisant,
 * sans franchir la frontière du module Membres autrement que par sa surface publique.
 */
public interface PaymentReferenceRepository {

    List<PaymentReferenceView.Reference> findAll();

    Optional<PaymentReferenceView.Reference> findById(UUID id);

    /** Référence vivante (non révoquée) d'un cotisant pour un exercice : sert l'idempotence. */
    Optional<PaymentReferenceView.Reference> findLive(UUID membershipId, int exercise);

    /** Vrai si l'adhésion existe : contrôlé sur la vue de lecture des adhésions. */
    boolean membershipExists(UUID membershipId);

    /** Génère une référence unique (via séquence) en état non diffusable. */
    PaymentReferenceView.Reference generate(UUID membershipId, int exercise, UUID actorUserId);

    PaymentReferenceView.Reference validate(UUID id, UUID actorUserId);

    PaymentReferenceView.Reference revoke(UUID id, UUID actorUserId);
}
