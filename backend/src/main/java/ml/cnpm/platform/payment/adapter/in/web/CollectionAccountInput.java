package ml.cnpm.platform.payment.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import ml.cnpm.platform.payment.application.CollectionAccountDraft;

/**
 * Corps de {@code POST /collection-accounts}.
 *
 * <p>La forme est validée au bord du système ; les règles (canal reconnu, banque requise pour
 * un virement, unicité du numéro) restent au service applicatif. Le compte naît toujours en
 * brouillon : aucun état n'est accepté du client.
 */
public record CollectionAccountInput(
        @NotBlank @Pattern(regexp = "ORANGE_MONEY|WAVE|MTN_MONEY|BANK_TRANSFER") String channel,
        @NotBlank @Size(max = 120) String label,
        @NotBlank @Size(max = 160) String accountHolder,
        @NotBlank @Size(max = 120) String accountIdentifier,
        @Size(max = 120) String bankName,
        @Size(max = 2000) String instructions) {

    public CollectionAccountDraft toDraft() {
        return new CollectionAccountDraft(
                channel, label, accountHolder, accountIdentifier, bankName, instructions);
    }
}
