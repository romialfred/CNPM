package ml.cnpm.platform.payment.application;

import java.math.BigDecimal;
import java.util.List;

/**
 * Projection membre des reçus officiels ({@code GET /portal/receipts}).
 *
 * <p>Le reçu témoigne d'un encaissement confirmé par la CNPM. Cette vue restitue au cotisant le
 * contenu opposable de SES reçus — numéro officiel, exercice, montant, canal, dates et état — sans
 * exposer le jeton de vérification (dont seule l'empreinte est conservée) ni le contenu binaire du
 * PDF archivé.
 */
public final class MemberReceiptHistoryView {

    private MemberReceiptHistoryView() {}

    public record Receipt(
            String id,
            String receiptNumber,
            String transactionNumber,
            String referenceValue,
            Integer exercise,
            String channel,
            BigDecimal amount,
            String currency,
            String paidAt,
            String issuedAt,
            String status) {}

    public record ReceiptList(List<Receipt> receipts) {}
}
