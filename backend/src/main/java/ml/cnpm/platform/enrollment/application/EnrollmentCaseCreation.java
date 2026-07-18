package ml.cnpm.platform.enrollment.application;

import ml.cnpm.platform.enrollment.domain.EnrollmentCase;

/**
 * Résultat d'une demande de création de dossier : {@code created} distingue une création
 * réelle (201) d'un rejeu idempotent d'un dossier déjà présent à l'identique (200).
 */
public record EnrollmentCaseCreation(EnrollmentCase value, boolean created) {}
