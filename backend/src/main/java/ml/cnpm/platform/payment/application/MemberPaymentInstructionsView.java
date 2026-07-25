package ml.cnpm.platform.payment.application;

import java.util.List;

/**
 * Instructions de paiement présentées au cotisant dans son espace membre.
 *
 * <p>Ne contient que ce qui est diffusable : les références VALIDÉES par la CNPM et les comptes
 * d'encaissement ACTIFS. Une référence en attente de validation ou un compte non validé
 * n'apparaissent jamais — c'est le garde-fou du TDR, tenu par le serveur.
 */
public final class MemberPaymentInstructionsView {

    private MemberPaymentInstructionsView() {}

    /** La référence de paiement diffusable d'un cotisant pour un exercice. */
    public record ReferenceLine(String id, String referenceValue, Integer exercise) {}

    /** Une coordonnée d'encaissement de la CNPM que le cotisant peut utiliser pour payer. */
    public record AccountLine(
            String id,
            String channel,
            String label,
            String accountHolder,
            String accountIdentifier,
            String bankName,
            String instructions) {}

    /**
     * @param references références validées du cotisant (souvent une par exercice)
     * @param collectionAccounts comptes d'encaissement actifs, à présenter par canal
     */
    public record Instructions(
            List<ReferenceLine> references, List<AccountLine> collectionAccounts) {}
}
