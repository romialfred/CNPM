package ml.cnpm.platform.contribution.adapter.in.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import ml.cnpm.platform.contribution.domain.ContributionCall;

/** Projection de sortie d'un appel de cotisation. */
public record ContributionCallView(
        UUID id,
        String callNumber,
        UUID membershipId,
        int fiscalYear,
        BigDecimal amountDue,
        BigDecimal balanceAmount,
        String currency,
        LocalDate dueDate,
        String status,
        long version) {

    static ContributionCallView from(ContributionCall call) {
        return new ContributionCallView(
                call.id(),
                call.callNumber(),
                call.membershipId(),
                call.fiscalYear(),
                call.amountDue(),
                call.balanceAmount(),
                call.currency(),
                call.dueDate(),
                call.status(),
                call.version());
    }
}
