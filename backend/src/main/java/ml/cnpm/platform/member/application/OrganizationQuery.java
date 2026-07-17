package ml.cnpm.platform.member.application;

/**
 * Critères de recherche des entreprises.
 *
 * <p>Tous les filtres sont facultatifs ({@code null} = non appliqué). Le tri est borné à
 * un ensemble de champs autorisés côté adaptateur ; la taille de page est bornée au bord
 * du système.
 */
public record OrganizationQuery(
        String status,
        String organizationType,
        String sectorCode,
        String search,
        String sort,
        int page,
        int size) {}
