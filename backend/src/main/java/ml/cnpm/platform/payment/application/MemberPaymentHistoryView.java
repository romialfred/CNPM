package ml.cnpm.platform.payment.application;

import java.math.BigDecimal;
import java.util.List;

/**
 * Historique des encaissements du cotisant connecté ({@code GET /portal/payments}).
 *
 * <p>Chaque ligne est un encaissement réel rattaché à une référence du membre. La confirmation
 * de la CNPM se lit à la présence d'un reçu émis.
 */
public final class MemberPaymentHistoryView {

    private MemberPaymentHistoryView() {}

    /**
     * @param confirmed vrai si la CNPM a confirmé l'encaissement (un reçu a été émis)
     * @param receiptNumber numéro du reçu officiel, s'il existe
     */
    public record Payment(
            String id,
            String transactionNumber,
            String referenceValue,
            Integer exercise,
            String channel,
            BigDecimal amount,
            String currency,
            String paidAt,
            boolean confirmed,
            String receiptNumber) {}

    public record PaymentList(List<Payment> payments) {}
}
