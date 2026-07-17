package ml.cnpm.platform.shared.api;

import java.util.List;

/**
 * Page de résultats générique, indépendante du framework de persistance.
 *
 * <p>Élément du noyau partagé (module OPEN) : le domaine et l'application des modules
 * métier ne dépendent pas de {@code org.springframework.data}. L'adaptateur traduit la
 * {@code Page} de Spring Data vers cette forme, de sorte qu'un changement de mécanisme
 * de persistance ne remonte pas jusqu'aux services.
 *
 * @param page index de page, à partir de zéro (aligné sur le contrat OpenAPI)
 */
public record PageResult<T>(
        List<T> items, int page, int size, long totalElements, int totalPages) {}
