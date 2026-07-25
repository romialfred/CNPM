package ml.cnpm.platform.payment.application;

import java.math.BigDecimal;
import java.util.List;

/**
 * Projection de lecture des reçus officiels.
 *
 * <p>Le reçu témoigne d'un encaissement confirmé par la CNPM. La vérification publique n'expose
 * qu'un sous-ensemble non nominatif : de quoi confirmer l'authenticité sans divulguer le dossier.
 */
public final class ReceiptView {

    private ReceiptView() {}

    /** Reçu tel qu'il est présenté à la CNPM ou au cotisant. */
    public record Receipt(
            String id,
            String receiptNumber,
            String transactionNumber,
            String referenceValue,
            String membershipNumber,
            String organizationName,
            String channel,
            BigDecimal amount,
            String currency,
            String paidAt,
            String issuedAt,
            String status) {}

    public record ReceiptList(List<Receipt> receipts) {}

    /**
     * Résultat d'une vérification publique par jeton.
     *
     * @param valid vrai si le jeton correspond à un reçu émis et non annulé
     */
    public record Verification(
            boolean valid,
            String receiptNumber,
            String organizationName,
            BigDecimal amount,
            String currency,
            String issuedAt,
            String status) {

        public static Verification invalid() {
            return new Verification(false, null, null, null, null, null, null);
        }
    }
}
