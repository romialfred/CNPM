package ml.cnpm.platform.member.application.port.out;

import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.member.application.OrganizationDraft;
import ml.cnpm.platform.member.application.OrganizationPatch;
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

    /** Retourne l'entreprise portant cet identifiant technique, ou vide si aucune. */
    Optional<Organization> findById(UUID id);

    /**
     * Retourne l'entreprise portant cet identifiant métier ({@code type}, {@code value}),
     * ou vide si aucune — support de l'idempotence par clé naturelle à la création.
     */
    Optional<Organization> findByIdentifier(String identifierType, String identifierValue);

    /**
     * Crée une entreprise et son identifiant métier de façon atomique, et retourne
     * l'entreprise créée (identifiant technique et version renseignés). L'unicité de
     * l'identifiant métier est garantie par contrainte : une insertion concurrente en
     * doublon lève une violation d'intégrité, traduite en conflit d'état en amont.
     */
    Organization create(OrganizationDraft draft);

    /**
     * Applique une modification partielle à l'entreprise et retourne son état résultant. Le
     * verrou optimiste ({@code @Version}) au flush lève une exception si une modification
     * concurrente est survenue entre-temps, traduite en conflit d'état en amont.
     */
    Organization update(UUID id, OrganizationPatch patch);
}
