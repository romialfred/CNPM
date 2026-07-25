package ml.cnpm.platform.member.application;

import java.util.List;

/**
 * Actualités et informations de l'espace membre ({@code GET /portal/events}).
 *
 * <p>Projection des événements CNPM RÉELLEMENT publiés (assemblées, formations, forums). Aucune
 * actualité n'est fabriquée : tant qu'aucun événement n'est publié, la liste est vide. Les
 * brouillons et les événements annulés ne franchissent jamais cette frontière.
 */
public final class MemberEventView {

    private MemberEventView() {}

    public record Summary(
            String id,
            String code,
            String title,
            String type,
            String startAt,
            String endAt,
            Integer capacity,
            String status) {}

    public record Page(
            List<Summary> items, int page, int size, long totalElements, int totalPages) {}
}
