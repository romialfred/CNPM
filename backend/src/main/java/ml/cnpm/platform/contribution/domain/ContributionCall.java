package ml.cnpm.platform.contribution.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Appel de cotisation émis à un membre pour un exercice.
 *
 * <p>Montants en {@code numeric(19,2)} — jamais de flottant ({@code CLAUDE.md}).
 * {@code balanceAmount} est le reste dû : égal au montant appelé tant qu'aucun paiement n'est
 * imputé. RG-004 : un appel publié ne se supprime pas ; il s'annule ou s'ajuste par écriture
 * compensatrice.
 */
public record ContributionCall(
        UUID id,
        String callNumber,
        UUID membershipId,
        int fiscalYear,
        BigDecimal amountDue,
        BigDecimal balanceAmount,
        String currency,
        LocalDate dueDate,
        String status,
        long version) {}
