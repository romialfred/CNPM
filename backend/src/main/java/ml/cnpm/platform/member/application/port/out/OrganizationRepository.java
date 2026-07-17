package ml.cnpm.platform.member.application.port.out;

import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.member.application.OrganizationQuery;
import ml.cnpm.platform.member.domain.Organization;
import ml.cnpm.platform.shared.api.PageResult;

/**
 * Port sortant de lecture des entreprises membres.
 *
 * <p>Le service applicatif dépend de cette abstraction, jamais de Spring Data : le
 * domaine reste au centre, le framework en périphérie.
 */
public interface OrganizationRepository {

    PageResult<Organization> search(OrganizationQuery query);

    /** Retourne l'entreprise portant cet identifiant, ou vide si aucune. */
    Optional<Organization> findById(UUID id);
}
