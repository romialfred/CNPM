package ml.cnpm.platform.member.application.port.out;

import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.member.domain.Membership;

/**
 * Port sortant d'écriture des adhésions : activation d'un membre.
 *
 * <p>Distinct du port de lecture ({@code MembershipRepository}), qui sert la vue enrichie de
 * BO-002.
 */
public interface MembershipActivationRepository {

    /** Recherche par identité métier — support de l'idempotence de l'activation. */
    Optional<Membership> findByMembershipNumber(String membershipNumber);

    /**
     * Vrai si l'entreprise porte déjà une adhésion active — support de RG-002 (« une entreprise
     * ne peut disposer que d'un compte membre actif par personnalité juridique »).
     */
    boolean hasActiveMembership(UUID organizationId);

    /**
     * Crée l'adhésion au statut actif et consigne la transition initiale dans l'historique
     * append-only, dans la même transaction.
     */
    Membership activate(
            UUID organizationId,
            String membershipNumber,
            String categoryCode,
            String reason,
            UUID actorUserId);
}
