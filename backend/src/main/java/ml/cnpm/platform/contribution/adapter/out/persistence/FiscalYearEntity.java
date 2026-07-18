package ml.cnpm.platform.contribution.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.LocalDate;
import java.util.UUID;

/** Projection JPA de {@code contribution.fiscal_year}. */
@Entity
@Table(name = "fiscal_year", schema = "contribution")
class FiscalYearEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected FiscalYearEntity() {
        // Requis par JPA.
    }

    FiscalYearEntity(UUID id, int year, LocalDate startDate, LocalDate endDate, String status) {
        this.id = id;
        this.year = year;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
    }

    UUID getId() {
        return id;
    }

    int getYear() {
        return year;
    }
}
