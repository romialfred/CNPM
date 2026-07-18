package ml.cnpm.platform.contribution.application;

import ml.cnpm.platform.contribution.domain.ContributionCall;

/**
 * Résultat d'une émission : {@code issued} distingue une émission réelle (201) d'un rejeu
 * idempotent d'un appel déjà émis à l'identique (200).
 */
public record ContributionCallIssuance(ContributionCall value, boolean issued) {}
