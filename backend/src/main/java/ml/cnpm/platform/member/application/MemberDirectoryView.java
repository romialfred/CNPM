package ml.cnpm.platform.member.application;

import java.util.List;

/**
 * Annuaire des organisations membres ({@code GET /portal/directory}).
 *
 * <p>Projection non nominative et non sensible : elle n'expose que des attributs institutionnels
 * d'organisations dont l'adhésion est ACTIVE — ni contact, ni adresse, ni identifiant fiscal, ni
 * donnée financière. Les coordonnées relèvent de la vitrine membre (R4) et de son consentement.
 */
public final class MemberDirectoryView {

    private MemberDirectoryView() {}

    public record Organization(
            String id, String name, String sector, String category, String memberSince) {}

    public record Page(
            List<Organization> items, int page, int size, long totalElements, int totalPages) {}
}
