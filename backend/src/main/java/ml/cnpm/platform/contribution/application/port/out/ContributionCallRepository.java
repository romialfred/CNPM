package ml.cnpm.platform.contribution.application.port.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.contribution.application.ContributionCallDraft;
import ml.cnpm.platform.contribution.domain.ContributionCall;

/** Port sortant du module COTISATION : appels de cotisation et exercices. */
public interface ContributionCallRepository {

    /** Recherche par identité métier — support de l'idempotence d'émission. */
    Optional<ContributionCall> findByCallNumber(String callNumber);

    /** Appels d'un membre, du plus récent au plus ancien. */
    List<ContributionCall> findByMembership(UUID membershipId);

    /**
     * Émet l'appel. L'exercice est ouvert à la volée s'il n'existe pas (année civile) —
     * hypothèse consignée : aucune source ne définit les dates d'exercice.
     */
    ContributionCall issue(ContributionCallDraft draft);
}
