package ml.cnpm.platform.contribution.adapter.in.web;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import ml.cnpm.platform.contribution.application.ContributionCallDraft;

/**
 * Corps d'émission d'un appel de cotisation.
 *
 * <p>Le montant est <strong>saisi par l'agent</strong> : aucun barème n'est fixé par les
 * sources (DEC-008). Il est borné en forme (positif, deux décimales) mais pas en valeur —
 * plafonner arbitrairement serait inventer une règle financière.
 */
public record ContributionCallInput(
        @NotBlank @Size(max = 60) String callNumber,
        @NotNull UUID membershipId,
        @Min(2000) @Max(2100) int fiscalYear,
        @NotNull @DecimalMin(value = "0.00") @Digits(integer = 17, fraction = 2) BigDecimal amountDue,
        @NotNull LocalDate dueDate) {

    ContributionCallDraft toDraft() {
        return new ContributionCallDraft(callNumber, membershipId, fiscalYear, amountDue, dueDate);
    }
}
