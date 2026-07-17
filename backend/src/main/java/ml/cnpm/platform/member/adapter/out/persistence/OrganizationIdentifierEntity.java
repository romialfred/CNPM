package ml.cnpm.platform.member.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.util.UUID;

/**
 * Projection JPA de {@code member.organization_identifier}, interne à l'adaptateur.
 *
 * <p>Porte l'identifiant métier d'une entreprise (type + valeur), dont l'unicité
 * {@code uq_member_identifier_type_value} sert de clé naturelle d'idempotence à la
 * création. Cette entité ne franchit jamais la frontière de l'API.
 */
@Entity
@Table(name = "organization_identifier", schema = "member")
class OrganizationIdentifierEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "identifier_type", nullable = false, length = 40)
    private String identifierType;

    @Column(name = "identifier_value", nullable = false, length = 160)
    private String identifierValue;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected OrganizationIdentifierEntity() {
        // Requis par JPA.
    }

    OrganizationIdentifierEntity(
            UUID id, UUID organizationId, String identifierType, String identifierValue) {
        this.id = id;
        this.organizationId = organizationId;
        this.identifierType = identifierType;
        this.identifierValue = identifierValue;
    }

    UUID getOrganizationId() {
        return organizationId;
    }

    String getIdentifierType() {
        return identifierType;
    }

    String getIdentifierValue() {
        return identifierValue;
    }
}
