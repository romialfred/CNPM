package ml.cnpm.platform.member.application;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Utilisateurs de l'organisation du cotisant connecté ({@code GET /portal/users}).
 *
 * <p><b>Périmètre.</b> Aucun identifiant d'organisation n'est accepté du client : il est résolu
 * depuis le compte authentifié ({@code member_id → membership.organization_id}). Un membre ne voit
 * que les comptes de SA propre organisation.
 *
 * <p><b>Souveraineté.</b> Vue consultative : le portail n'expose ni sujet Keycloak, ni permission
 * fine, ni secret. Le rôle est un libellé agrégé, non attribuable ici.
 */
@Service
public class MemberUserQueryService {

    private final JdbcTemplate jdbc;

    MemberUserQueryService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @PreAuthorize("hasAuthority('PERM_CONTRIBUTION.READ')")
    @Transactional(readOnly = true)
    public MemberUserView.Page list(UUID accountId, int page, int size) {
        UUID organizationId = requireOrganization(accountId);

        // Comptes MEMBRE rattachés à une adhésion de cette organisation.
        String from =
                " FROM iam.user_account u"
                        + " JOIN member.membership m ON m.id = u.member_id"
                        + " WHERE u.account_type = 'MEMBER' AND m.organization_id = ?";

        Long total = jdbc.queryForObject("SELECT count(*)" + from, Long.class, organizationId);
        long totalElements = total == null ? 0L : total;

        List<MemberUserView.Summary> items =
                jdbc.query(
                        "SELECT u.id, u.display_name, u.email, u.status,"
                                + " to_char(u.last_login_at, 'YYYY-MM-DD\"T\"HH24:MI:SSOF') AS last_login,"
                                + " (SELECT string_agg(DISTINCT r.label, ', ' ORDER BY r.label)"
                                + "    FROM iam.user_role ur JOIN iam.role r ON r.id = ur.role_id"
                                + "    WHERE ur.user_id = u.id"
                                + "      AND (ur.valid_to IS NULL OR ur.valid_to > now())) AS role_label"
                                + from
                                + " ORDER BY u.display_name ASC, u.id ASC LIMIT ? OFFSET ?",
                        (rs, i) ->
                                new MemberUserView.Summary(
                                        rs.getString("id"),
                                        rs.getString("display_name"),
                                        rs.getString("email"),
                                        Optional.ofNullable(rs.getString("role_label")).orElse("—"),
                                        rs.getString("status"),
                                        rs.getString("last_login")),
                        organizationId,
                        size,
                        page * size);

        int totalPages = size <= 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        return new MemberUserView.Page(items, page, size, totalElements, totalPages);
    }

    private UUID requireOrganization(UUID accountId) {
        return Optional.ofNullable(accountId)
                .flatMap(
                        id ->
                                jdbc
                                        .query(
                                                "SELECT m.organization_id FROM iam.user_account u"
                                                        + " JOIN member.membership m ON m.id = u.member_id"
                                                        + " WHERE u.id = ? AND u.member_id IS NOT NULL",
                                                (rs, i) -> rs.getObject("organization_id", UUID.class),
                                                id)
                                        .stream()
                                        .findFirst())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Aucune adhésion n’est rattachée à ce compte."));
    }
}
