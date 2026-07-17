package ml.cnpm.platform.member.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.util.UUID;

/**
 * Projection JPA de {@code member.organization}, interne à l'adaptateur de persistance.
 *
 * <p>Cette entité ne franchit jamais la frontière de l'API. Seules les colonnes lues sont
 * mappées ; {@code ddl-auto: validate} ne contrôle que celles-ci.
 */
@Entity
@Table(name = "organization", schema = "member")
class OrganizationEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "legal_name", nullable = false, length = 255)
    private String legalName;

    @Column(name = "trade_name", length = 255)
    private String tradeName;

    @Column(name = "organization_type", nullable = false, length = 40)
    private String organizationType;

    @Column(name = "sector_code", length = 80)
    private String sectorCode;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "risk_level", nullable = false, length = 20)
    private String riskLevel;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected OrganizationEntity() {
        // Requis par JPA.
    }

    UUID getId() {
        return id;
    }

    String getLegalName() {
        return legalName;
    }

    String getTradeName() {
        return tradeName;
    }

    String getOrganizationType() {
        return organizationType;
    }

    String getSectorCode() {
        return sectorCode;
    }

    String getStatus() {
        return status;
    }

    String getRiskLevel() {
        return riskLevel;
    }

    long getVersion() {
        return version == null ? 0L : version;
    }
}
