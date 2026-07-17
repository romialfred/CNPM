package ml.cnpm.platform.administration.application;

import java.util.List;

/**
 * Page de résultats indépendante du framework de persistance.
 *
 * <p>Le domaine et l'application ne dépendent pas de {@code org.springframework.data} :
 * l'adaptateur traduit la {@code Page} de Spring Data vers cette forme, de sorte qu'un
 * changement de mécanisme de persistance ne remonte pas jusqu'au service.
 *
 * @param page index de page, à partir de zéro (aligné sur le contrat OpenAPI)
 */
public record PageResult<T>(
        List<T> items, int page, int size, long totalElements, int totalPages) {}
