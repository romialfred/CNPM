package ml.cnpm.platform.professionalgroup.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.util.UUID;

/** Projection JPA interne de {@code member.professional_group}. */
@Entity
@Table(name = "professional_group", schema = "member")
class ProfessionalGroupEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "code", nullable = false, length = 60)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "sector_code", length = 80)
    private String sectorCode;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected ProfessionalGroupEntity() {
        // Requis par JPA.
    }

    UUID getId() {
        return id;
    }

    String getCode() {
        return code;
    }

    String getName() {
        return name;
    }

    String getSectorCode() {
        return sectorCode;
    }

    String getStatus() {
        return status;
    }

    long getVersion() {
        return version == null ? 0L : version;
    }
}
