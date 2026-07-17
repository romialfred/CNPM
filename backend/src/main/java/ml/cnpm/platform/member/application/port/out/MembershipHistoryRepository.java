package ml.cnpm.platform.member.application.port.out;

import java.util.UUID;
import ml.cnpm.platform.member.domain.MembershipStatusChange;
import ml.cnpm.platform.shared.api.PageResult;

/**
 * Port sortant de lecture de l'historique des statuts d'adhésion, par entreprise.
 *
 * <p>Le service dépend de cette abstraction, jamais de Spring Data. L'ordre est du plus
 * récent au plus ancien, avec un départage stable ; la taille de page est bornée au bord.
 */
public interface MembershipHistoryRepository {

    PageResult<MembershipStatusChange> findByOrganization(UUID organizationId, int page, int size);
}
