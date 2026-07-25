package ml.cnpm.platform.member.application;

import java.util.List;

/**
 * Projection membre des utilisateurs de l'organisation ({@code GET /portal/users}).
 *
 * <p>Consultative et auto-bornée : aucun sujet Keycloak, secret MFA, jeton, session ni attribut
 * d'audit n'est exposé. Le rôle reste un libellé indicatif, non attribuable depuis le portail.
 */
public final class MemberUserView {

    private MemberUserView() {}

    public record Summary(
            String id,
            String displayName,
            String email,
            String roleLabel,
            String status,
            String lastActivityAt) {}

    public record Page(
            List<Summary> items, int page, int size, long totalElements, int totalPages) {}
}
