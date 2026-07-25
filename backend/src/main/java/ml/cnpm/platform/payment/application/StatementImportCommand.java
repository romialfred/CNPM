package ml.cnpm.platform.payment.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Commande d'import d'un relevé (format neutre, en attendant l'arbitrage du format réel
 * DEC-003). Le montant est un {@code numeric(19,2)} ; le libellé porte, le cas échéant, la
 * référence du cotisant.
 */
public record StatementImportCommand(
        String bankCode,
        String statementRef,
        String accountRefMasked,
        LocalDate periodStart,
        LocalDate periodEnd,
        List<Line> lines) {

    public record Line(
            int lineNumber,
            LocalDate bookingDate,
            LocalDate valueDate,
            BigDecimal amount,
            String referenceText) {}
}
