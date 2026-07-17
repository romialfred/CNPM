package ml.cnpm.platform.member.application;

/**
 * Critères de recherche des adhésions.
 *
 * <p>Filtres facultatifs ({@code null} = non appliqué). {@code groupCode} filtre sur le
 * code du groupement professionnel principal. Le tri est borné à un ensemble de champs
 * autorisés côté adaptateur ; la taille de page est bornée au bord du système.
 */
public record MembershipQuery(
        String status,
        String categoryCode,
        String groupCode,
        String search,
        String sort,
        int page,
        int size) {}
