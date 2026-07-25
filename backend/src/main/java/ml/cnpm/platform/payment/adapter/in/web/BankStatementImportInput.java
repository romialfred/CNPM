package ml.cnpm.platform.payment.adapter.in.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import ml.cnpm.platform.payment.application.StatementImportCommand;

/**
 * Corps de {@code POST /bank-statements/import}.
 *
 * <p>Format neutre en attendant l'arbitrage du format réel (DEC-003). Les montants sont
 * transmis en chaîne décimale, jamais en flottant.
 */
public record BankStatementImportInput(
        @NotBlank @Size(max = 60) String bankCode,
        @NotBlank @Size(max = 120) String statementRef,
        @NotBlank @Size(max = 80) String accountRefMasked,
        @NotNull LocalDate periodStart,
        @NotNull LocalDate periodEnd,
        @NotEmpty @Size(max = 5000) @Valid List<LineInput> lines) {

    public record LineInput(
            @Positive int lineNumber,
            @NotNull LocalDate bookingDate,
            LocalDate valueDate,
            @NotBlank @Pattern(regexp = "\\d{1,17}(\\.\\d{1,2})?") String amount,
            @Size(max = 1000) String referenceText) {

        StatementImportCommand.Line toLine() {
            return new StatementImportCommand.Line(
                    lineNumber, bookingDate, valueDate, new BigDecimal(amount), referenceText);
        }
    }

    public StatementImportCommand toCommand() {
        return new StatementImportCommand(
                bankCode,
                statementRef,
                accountRefMasked,
                periodStart,
                periodEnd,
                lines.stream().map(LineInput::toLine).toList());
    }
}
