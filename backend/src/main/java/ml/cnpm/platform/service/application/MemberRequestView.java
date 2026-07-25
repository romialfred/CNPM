package ml.cnpm.platform.service.application;

import java.util.List;

/**
 * Projection membre des requêtes et réclamations ({@code /portal/requests}).
 *
 * <p>Périmètre : l'organisation de l'adhésion du compte connecté. Le membre ne voit que les
 * échanges PARTAGÉS ({@code visibility = SHARED}) : les notes internes de la CNPM ne franchissent
 * jamais cette frontière — REQ-004 est respectée par la requête elle-même, non par un masquage
 * d'affichage.
 */
public final class MemberRequestView {

    private MemberRequestView() {}

    /** Ligne de liste : l'essentiel pour situer une requête sans en charger la conversation. */
    public record Summary(
            String id,
            String reference,
            String type,
            String subject,
            String status,
            String priority,
            String createdAt,
            String updatedAt) {}

    public record Page(
            List<Summary> items, int page, int size, long totalElements, int totalPages) {}

    /** Un échange partagé de la conversation. {@code sender} vaut MEMBER ou AGENT. */
    public record Message(String id, String sender, String body, String createdAt) {}

    /** Détail : l'en-tête, la description d'origine et la conversation partagée. */
    public record Detail(
            String id,
            String reference,
            String type,
            String subject,
            String description,
            String status,
            String priority,
            String createdAt,
            String updatedAt,
            List<Message> conversation) {}
}
