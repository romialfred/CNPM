package ml.cnpm.platform.payment.application;

import java.util.List;

/**
 * Projection de lecture des comptes d'encaissement de la CNPM pour l'écran de configuration.
 *
 * <p>La même projection sert la liste et le retour d'une écriture : après une création ou une
 * validation, l'écran lit exactement ce que la liste afficherait au rechargement.
 */
public final class CollectionAccountView {

    private CollectionAccountView() {}

    /**
     * Un compte d'encaissement tel qu'il est présenté à l'administration.
     *
     * @param status DRAFT (non diffusable), ACTIVE (diffusable) ou DISABLED (retiré)
     */
    public record Account(
            String id,
            String channel,
            String label,
            String accountHolder,
            String accountIdentifier,
            String bankName,
            String instructions,
            String status,
            String approvedAt,
            String createdAt) {}

    /** Enveloppe de liste, pour laisser la vue s'enrichir sans rompre le contrat. */
    public record CollectionAccountList(List<Account> accounts) {}
}
