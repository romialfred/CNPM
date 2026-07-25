package ml.cnpm.platform.member.application;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Annuaire des organisations membres — projection consultative de l'espace membre.
 *
 * <p><b>Périmètre.</b> Seules les organisations dont l'adhésion est ACTIVE figurent à l'annuaire.
 * La vue est non nominative : aucun contact, adresse, identifiant fiscal ni donnée financière n'y
 * apparaît — ces coordonnées relèvent de la vitrine membre (R4) et de son consentement.
 *
 * <p>{@code CONTRIBUTION.READ} borne l'accès au portail authentifié ; l'annuaire est transverse
 * (il liste d'autres organisations), aussi aucune adhésion propre n'est exigée de l'appelant.
 */
@Service
public class MemberDirectoryQueryService {

    private final JdbcTemplate jdbc;

    MemberDirectoryQueryService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @PreAuthorize("hasAuthority('PERM_CONTRIBUTION.READ')")
    @Transactional(readOnly = true)
    public MemberDirectoryView.Page list(String search, int page, int size) {
        // Une organisation figure à l'annuaire dès qu'elle porte AU MOINS une adhésion active ;
        // ses attributs d'adhésion (catégorie, ancienneté) viennent de la plus ancienne active.
        String from =
                " FROM member.organization o"
                        + " JOIN LATERAL ("
                        + "   SELECT category_code, joined_at FROM member.membership m"
                        + "   WHERE m.organization_id = o.id AND m.status = 'ACTIVE'"
                        + "   ORDER BY m.joined_at NULLS LAST LIMIT 1"
                        + " ) mm ON true";

        StringBuilder where = new StringBuilder();
        List<Object> arguments = new ArrayList<>();
        String trimmed = search == null ? "" : search.trim();
        if (!trimmed.isBlank()) {
            where.append(" WHERE COALESCE(o.trade_name, o.legal_name) ILIKE ?");
            arguments.add("%" + trimmed + "%");
        }

        Long total =
                jdbc.queryForObject(
                        "SELECT count(*)" + from + where, Long.class, arguments.toArray());
        long totalElements = total == null ? 0L : total;

        List<Object> pageArguments = new ArrayList<>(arguments);
        pageArguments.add(size);
        pageArguments.add(page * size);
        List<MemberDirectoryView.Organization> items =
                jdbc.query(
                        "SELECT o.id, COALESCE(o.trade_name, o.legal_name) AS name, o.sector_code,"
                                + " mm.category_code,"
                                + " to_char(mm.joined_at, 'YYYY-MM-DD') AS member_since"
                                + from
                                + where
                                + " ORDER BY name ASC, o.id ASC LIMIT ? OFFSET ?",
                        (rs, i) ->
                                new MemberDirectoryView.Organization(
                                        rs.getString("id"),
                                        rs.getString("name"),
                                        Optional.ofNullable(rs.getString("sector_code")).orElse("—"),
                                        rs.getString("category_code"),
                                        rs.getString("member_since")),
                        pageArguments.toArray());

        int totalPages = size <= 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        return new MemberDirectoryView.Page(items, page, size, totalElements, totalPages);
    }
}
