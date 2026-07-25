package ml.cnpm.platform.payment.application;

/**
 * Résultat d'une génération de référence.
 *
 * @param created vrai si une référence a réellement été produite ; faux si une référence vivante
 *     existait déjà et a été renvoyée (rejeu idempotent)
 */
public record PaymentReferenceGeneration(PaymentReferenceView.Reference reference, boolean created) {}
