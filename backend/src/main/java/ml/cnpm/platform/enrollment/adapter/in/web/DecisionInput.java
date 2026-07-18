package ml.cnpm.platform.enrollment.adapter.in.web;

import jakarta.validation.constraints.Size;

/**
 * Corps d'une <strong>approbation</strong> d'enrôlement : le commentaire y est facultatif.
 * Le rejet, décision défavorable, utilise {@link RejectionInput} qui exige un motif.
 */
public record DecisionInput(@Size(max = 2000) String comment) {}
