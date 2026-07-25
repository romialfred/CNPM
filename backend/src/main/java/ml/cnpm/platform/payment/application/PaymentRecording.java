package ml.cnpm.platform.payment.application;

/**
 * Résultat de l'enregistrement d'un encaissement.
 *
 * @param created vrai si un encaissement a réellement été écrit ; faux si la clé d'idempotence
 *     désignait un encaissement déjà présent, alors renvoyé tel quel (rejeu)
 */
public record PaymentRecording(PaymentTransactionView.Payment payment, boolean created) {}
