package ml.cnpm.platform.payment.application;

import java.math.BigDecimal;
import java.util.List;

/**
 * Projection de lecture des encaissements enregistrés.
 *
 * <p>Chaque encaissement est rattaché à une référence de paiement, donc à un cotisant : la
 * jointure sur {@code member.membership_list} porte son nom pour l'écran de la CNPM. Les
 * montants sont des {@code numeric(19,2)} — jamais un flottant.
 */
public final class PaymentTransactionView {

    private PaymentTransactionView() {}

    /**
     * Un encaissement.
     *
     * @param status état de l'encaissement ('RECEIVED' à l'enregistrement)
     */
    public record Payment(
            String id,
            String transactionNumber,
            String referenceValue,
            String membershipNumber,
            String organizationName,
            String channel,
            BigDecimal amount,
            String currency,
            String paidAt,
            String status,
            String createdAt) {}

    public record PaymentList(List<Payment> payments) {}
}
