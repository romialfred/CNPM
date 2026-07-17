package ml.cnpm.platform.administration.application.port.out;

import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.shared.api.PageResult;
import ml.cnpm.platform.administration.application.ReferenceValueDraft;
import ml.cnpm.platform.administration.application.ReferenceValuePatch;
import ml.cnpm.platform.administration.domain.ReferenceValue;

/**
 * Port sortant des valeurs de référentiel.
 *
 * <p>Le service applicatif dépend de cette abstraction, jamais d'une implémentation
 * JPA concrète : l'inversion de dépendance garde le domaine au centre et le framework
 * en périphérie.
 */
public interface ReferenceValueRepository {

    /**
     * Liste paginée des valeurs de référentiel, éventuellement filtrée par domaine.
     *
     * @param domain domaine de référentiel, ou {@code null}/vide pour tous les domaines
     * @param page index de page à partir de zéro
     * @param size taille de page (déjà bornée en amont)
     */
    PageResult<ReferenceValue> list(String domain, int page, int size);

    /** Valeur portant ce couple (domaine, code), qui en forme l'identité métier unique. */
    Optional<ReferenceValue> findByDomainAndCode(String domain, String code);

    /** Valeur par son identifiant technique. */
    Optional<ReferenceValue> findById(UUID id);

    /**
     * Applique une modification partielle et retourne l'état résultant, version incrémentée.
     *
     * <p>Peut lever une exception de verrou optimiste si la valeur a été modifiée par une
     * transaction concurrente pendant l'opération.
     */
    ReferenceValue update(UUID id, ReferenceValuePatch patch);

    /**
     * Insère une nouvelle valeur et la retourne avec son identifiant technique.
     *
     * <p>Peut lever une violation d'intégrité si le couple (domaine, code) existe déjà —
     * cas d'une course entre deux créations concurrentes.
     */
    ReferenceValue create(ReferenceValueDraft draft);
}
