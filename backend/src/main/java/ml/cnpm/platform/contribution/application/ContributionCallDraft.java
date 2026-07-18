package ml.cnpm.platform.contribution.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Données d'émission d'un appel de cotisation.
 *
 * <p>{@code amountDue} est <strong>saisi par l'agent</strong>, non calculé : le barème
 * (DEC-008) n'est fixé par aucune source — ni le BRS, ni le TDR, qui renvoient les taux à une
 * négociation. Le calcul automatique par barème s'ajoutera sans rompre ce contrat.
 * {@code callNumber} est l'identité métier (unique) et sert de clé naturelle d'idempotence.
 */
public record ContributionCallDraft(
        String callNumber,
        UUID membershipId,
        int fiscalYear,
        BigDecimal amountDue,
        LocalDate dueDate) {}
