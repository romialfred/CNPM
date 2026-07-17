package ml.cnpm.platform.administration.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

/**
 * Projection JPA de {@code ref.reference_value}.
 *
 * <p>Interne à l'adaptateur de persistance : cette entité ne franchit jamais la
 * frontière de l'API ({@code .claude/rules/backend-java.md}). Seul un sous-ensemble de
 * colonnes est mappé — les champs d'audit et d'horodatage portent des valeurs par
 * défaut en base et ne sont pas requis en lecture ; {@code ddl-auto: validate} ne
 * contrôle que la cohérence des colonnes effectivement mappées.
 */
@Entity
@Table(name = "reference_value", schema = "ref")
class ReferenceValueEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "domain", nullable = false, length = 80)
    private String domain;

    @Column(name = "code", nullable = false, length = 80)
    private String code;

    @Column(name = "label", nullable = false, length = 255)
    private String label;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "valid_from")
    private Instant validFrom;

    @Column(name = "valid_to")
    private Instant validTo;

    /**
     * Verrou optimiste, exploité par les mises à jour à venir.
     *
     * <p>Type nullable volontaire : une version {@code null} signale une entité neuve, ce
     * qui laisse Spring Data insérer directement sans {@code SELECT} préalable ; Hibernate
     * l'initialise à 0 à l'insertion.
     */
    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected ReferenceValueEntity() {
        // Requis par JPA.
    }

    /** Construit une entité à insérer ; l'identifiant est assigné avant persistance. */
    ReferenceValueEntity(UUID id, String domain, String code, String label, int sortOrder, boolean active) {
        this.id = id;
        this.domain = domain;
        this.code = code;
        this.label = label;
        this.sortOrder = sortOrder;
        this.active = active;
    }

    UUID getId() {
        return id;
    }

    String getDomain() {
        return domain;
    }

    String getCode() {
        return code;
    }

    String getLabel() {
        return label;
    }

    int getSortOrder() {
        return sortOrder;
    }

    boolean isActive() {
        return active;
    }

    Instant getValidFrom() {
        return validFrom;
    }

    Instant getValidTo() {
        return validTo;
    }

    long getVersion() {
        return version == null ? 0L : version;
    }

    void applyLabel(String value) {
        this.label = value;
    }

    void applySortOrder(int value) {
        this.sortOrder = value;
    }

    void applyActive(boolean value) {
        this.active = value;
    }
}
