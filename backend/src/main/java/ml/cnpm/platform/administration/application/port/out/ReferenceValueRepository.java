package ml.cnpm.platform.administration.application.port.out;

import ml.cnpm.platform.administration.application.PageResult;
import ml.cnpm.platform.administration.domain.ReferenceValue;

/**
 * Port sortant de lecture des valeurs de référentiel.
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
}
