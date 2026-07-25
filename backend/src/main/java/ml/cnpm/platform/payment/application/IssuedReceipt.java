package ml.cnpm.platform.payment.application;

/**
 * Résultat d'une confirmation d'encaissement, avec le reçu émis.
 *
 * @param verificationToken jeton de vérification en clair — révélé UNE SEULE FOIS, à l'émission ;
 *     {@code null} si la confirmation était un rejeu (le reçu existait déjà)
 * @param created vrai si un reçu a réellement été émis ; faux pour un rejeu idempotent
 */
public record IssuedReceipt(ReceiptView.Receipt receipt, String verificationToken, boolean created) {}
