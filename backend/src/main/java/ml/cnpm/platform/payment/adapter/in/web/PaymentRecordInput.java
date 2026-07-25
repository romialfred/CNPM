package ml.cnpm.platform.payment.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Corps de {@code POST /payments} : enregistrement d'un encaissement reçu.
 *
 * <p>Le montant est transmis en CHAÎNE décimale, jamais en flottant — c'est la seule forme qui
 * traverse le contrat pour un {@code numeric(19,2)}. Sa forme est validée ici ; les règles
 * (référence validée, canal, positivité) restent au service.
 */
public record PaymentRecordInput(
        @NotNull UUID referenceId,
        @NotBlank @Pattern(regexp = "ORANGE_MONEY|WAVE|MTN_MONEY|BANK_TRANSFER|CASH") String channel,
        @NotBlank @Pattern(regexp = "\\d{1,17}(\\.\\d{1,2})?") String amount,
        OffsetDateTime paidAt,
        @Size(max = 160) String providerTransactionId) {

    public BigDecimal amountValue() {
        return new BigDecimal(amount);
    }

    public OffsetDateTime paidAtOrNow() {
        return paidAt != null ? paidAt : OffsetDateTime.now();
    }
}
