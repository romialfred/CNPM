package ml.cnpm.platform.contribution.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Projection JPA de {@code contribution.contribution_call}.
 *
 * <p>Montants en {@code BigDecimal} (colonne {@code numeric(19,2)}) — jamais de flottant.
 * L'exercice est joint explicitement par les requêtes de lecture, pour éviter un N+1.
 */
@Entity
@Table(name = "contribution_call", schema = "contribution")
class ContributionCallEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "membership_id", nullable = false)
    private UUID membershipId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fiscal_year_id", nullable = false)
    private FiscalYearEntity fiscalYear;

    @Column(name = "call_number", nullable = false, length = 60)
    private String callNumber;

    @Column(name = "amount_due", nullable = false, precision = 19, scale = 2)
    private BigDecimal amountDue;

    @Column(name = "balance_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal balanceAmount;

    /** Colonne {@code char(3)} : le type JDBC doit être explicite, sinon validate attend varchar. */
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.CHAR)
    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected ContributionCallEntity() {
        // Requis par JPA.
    }

    ContributionCallEntity(
            UUID id,
            UUID membershipId,
            FiscalYearEntity fiscalYear,
            String callNumber,
            BigDecimal amountDue,
            String currency,
            LocalDate dueDate,
            String status) {
        this.id = id;
        this.membershipId = membershipId;
        this.fiscalYear = fiscalYear;
        this.callNumber = callNumber;
        this.amountDue = amountDue;
        // À l'émission, rien n'est encaissé : le reste dû est le montant appelé.
        this.balanceAmount = amountDue;
        this.currency = currency;
        this.dueDate = dueDate;
        this.status = status;
    }

    UUID getId() {
        return id;
    }

    UUID getMembershipId() {
        return membershipId;
    }

    FiscalYearEntity getFiscalYear() {
        return fiscalYear;
    }

    String getCallNumber() {
        return callNumber;
    }

    BigDecimal getAmountDue() {
        return amountDue;
    }

    BigDecimal getBalanceAmount() {
        return balanceAmount;
    }

    String getCurrency() {
        return currency;
    }

    LocalDate getDueDate() {
        return dueDate;
    }

    String getStatus() {
        return status;
    }

    long getVersion() {
        return version == null ? 0L : version;
    }
}
