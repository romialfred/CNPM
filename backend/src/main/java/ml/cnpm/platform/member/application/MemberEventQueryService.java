package ml.cnpm.platform.member.application;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Actualités et informations — événements CNPM publiés, projection de l'espace membre.
 *
 * <p><b>Souveraineté.</b> Seuls les événements dont le statut n'est plus un brouillon et qui ne
 * sont pas annulés figurent au fil : un DRAFT ou un CANCELLED reste invisible au membre. Aucune
 * actualité n'est inventée — la liste reflète strictement ce que la CNPM a publié.
 *
 * <p>{@code CONTRIBUTION.READ} borne l'accès au portail authentifié. L'information est
 * institutionnelle et transverse ; aucune adhésion propre n'est exigée de l'appelant.
 */
@Service
public class MemberEventQueryService {

    private final JdbcTemplate jdbc;

    MemberEventQueryService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @PreAuthorize("hasAuthority('PERM_CONTRIBUTION.READ')")
    @Transactional(readOnly = true)
    public MemberEventView.Page list(int page, int size) {
        String where =
                " FROM event.event WHERE status NOT IN ('DRAFT', 'CANCELLED')";

        Long total = jdbc.queryForObject("SELECT count(*)" + where, Long.class);
        long totalElements = total == null ? 0L : total;

        List<MemberEventView.Summary> items =
                jdbc.query(
                        "SELECT id, event_code, title, event_type, capacity, status,"
                                + " to_char(start_at, 'YYYY-MM-DD\"T\"HH24:MI:SSOF') AS start_at,"
                                + " to_char(end_at, 'YYYY-MM-DD\"T\"HH24:MI:SSOF') AS end_at"
                                + where
                                + " ORDER BY start_at DESC, id ASC LIMIT ? OFFSET ?",
                        (rs, i) ->
                                new MemberEventView.Summary(
                                        rs.getString("id"),
                                        rs.getString("event_code"),
                                        rs.getString("title"),
                                        rs.getString("event_type"),
                                        rs.getString("start_at"),
                                        rs.getString("end_at"),
                                        rs.getObject("capacity", Integer.class),
                                        rs.getString("status")),
                        size,
                        page * size);

        int totalPages = size <= 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        return new MemberEventView.Page(items, page, size, totalElements, totalPages);
    }
}
