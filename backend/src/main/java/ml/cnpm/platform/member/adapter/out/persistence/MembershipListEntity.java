package ml.cnpm.platform.member.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;
import org.hibernate.annotations.Immutable;

/**
 * Projection JPA en LECTURE SEULE de la vue {@code member.membership_list}.
 *
 * <p>La vue résout en SQL, pour chaque adhésion, la raison sociale de l'entreprise et son
 * groupement professionnel principal (déterministe, un seul). L'entité expose donc des
 * colonnes scalaires : aucune relation vers-plusieurs, donc pas de N+1 ni de jointure
 * fetch à la pagination. {@code @Immutable} car une vue ne se met pas à jour.
 */
@Entity
@Immutable
@Table(name = "membership_list", schema = "member")
class MembershipListEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "membership_number", nullable = false)
    private String membershipNumber;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "organization_legal_name", nullable = false)
    private String organizationLegalName;

    @Column(name = "category_code", nullable = false)
    private String categoryCode;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "joined_at")
    private LocalDate joinedAt;

    @Column(name = "version", nullable = false)
    private Long version;

    /** Nuls lorsque l'entreprise n'a aucun groupement principal actif. */
    @Column(name = "primary_group_code")
    private String primaryGroupCode;

    @Column(name = "primary_group_name")
    private String primaryGroupName;

    /** Nuls lorsque l'entreprise n'a aucun représentant légal actif. */
    @Column(name = "primary_contact_name")
    private String primaryContactName;

    @Column(name = "primary_contact_email")
    private String primaryContactEmail;

    @Column(name = "primary_contact_phone")
    private String primaryContactPhone;

    protected MembershipListEntity() {
        // Requis par JPA.
    }

    UUID getId() {
        return id;
    }

    String getMembershipNumber() {
        return membershipNumber;
    }

    UUID getOrganizationId() {
        return organizationId;
    }

    String getOrganizationLegalName() {
        return organizationLegalName;
    }

    String getCategoryCode() {
        return categoryCode;
    }

    String getStatus() {
        return status;
    }

    LocalDate getJoinedAt() {
        return joinedAt;
    }

    long getVersion() {
        return version == null ? 0L : version;
    }

    String getPrimaryGroupCode() {
        return primaryGroupCode;
    }

    String getPrimaryGroupName() {
        return primaryGroupName;
    }

    String getPrimaryContactName() {
        return primaryContactName;
    }

    String getPrimaryContactEmail() {
        return primaryContactEmail;
    }

    String getPrimaryContactPhone() {
        return primaryContactPhone;
    }
}
