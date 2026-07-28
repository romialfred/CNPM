package ml.cnpm.platform.member.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/**
 * Projection JPA de {@code member.organization_sector} : un secteur d'activité rattaché à
 * une entreprise (relation multi-valuée). Le secteur principal reste porté par
 * {@code member.organization.sector_code} ; cette table complète l'ensemble.
 *
 * <p>Clé primaire composite ({@code organization_id}, {@code sector_code}) — aucune clé
 * technique superflue pour une pure table de liaison. Cette entité ne franchit jamais la
 * frontière de l'API.
 */
@Entity
@Table(name = "organization_sector", schema = "member")
@IdClass(OrganizationSectorEntity.Key.class)
class OrganizationSectorEntity {

    @Id
    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Id
    @Column(name = "sector_code", nullable = false, length = 80)
    private String sectorCode;

    protected OrganizationSectorEntity() {
        // Requis par JPA.
    }

    OrganizationSectorEntity(UUID organizationId, String sectorCode) {
        this.organizationId = organizationId;
        this.sectorCode = sectorCode;
    }

    UUID getOrganizationId() {
        return organizationId;
    }

    String getSectorCode() {
        return sectorCode;
    }

    /** Clé composite de {@link OrganizationSectorEntity} (exigée par {@code @IdClass}). */
    static class Key implements Serializable {
        private UUID organizationId;
        private String sectorCode;

        Key() {}

        Key(UUID organizationId, String sectorCode) {
            this.organizationId = organizationId;
            this.sectorCode = sectorCode;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (!(other instanceof Key key)) {
                return false;
            }
            return Objects.equals(organizationId, key.organizationId)
                    && Objects.equals(sectorCode, key.sectorCode);
        }

        @Override
        public int hashCode() {
            return Objects.hash(organizationId, sectorCode);
        }
    }
}
