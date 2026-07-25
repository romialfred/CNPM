package ml.cnpm.platform.payment.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Corps de {@code POST /reconciliations/{id}/decide} : confirmer l'appariement (l'encaissement
 * est alors créé) ou le rejeter, avec un motif.
 */
public record ReconciliationDecisionInput(
        @NotBlank @Pattern(regexp = "CONFIRM|REJECT") String decision,
        @Size(max = 1000) String reason) {

    public boolean confirm() {
        return "CONFIRM".equals(decision);
    }
}
