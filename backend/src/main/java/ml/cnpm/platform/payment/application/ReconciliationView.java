package ml.cnpm.platform.payment.application;

import java.math.BigDecimal;
import java.util.List;

/**
 * Projection de lecture du rapprochement automatique.
 *
 * <p>Chaque cas relie une ligne de relevé à un cotisant lorsque sa référence a été lue dans le
 * libellé. Les cas non rapprochés (aucune référence exploitable) sont isolés pour traitement.
 */
public final class ReconciliationView {

    private ReconciliationView() {}

    /**
     * Un cas de rapprochement.
     *
     * @param status PROPOSED (à confirmer), CONFIRMED (encaissement créé), REJECTED, UNMATCHED
     */
    public record Case(
            String id,
            String bookingDate,
            BigDecimal amount,
            String currency,
            String referenceText,
            BigDecimal matchScore,
            String status,
            String matchedReferenceValue,
            String membershipNumber,
            String organizationName,
            String paymentTransactionNumber) {}

    public record CaseList(List<Case> cases) {}

    /**
     * Bilan d'un import de relevé.
     *
     * @param matched lignes appariées à une référence validée (à confirmer)
     * @param unmatched lignes sans référence exploitable (traitement manuel)
     * @param duplicates lignes déjà importées (ignorées, dédoublonnées par empreinte)
     */
    public record ImportSummary(
            String statementId,
            String statementRef,
            int importedLines,
            int matched,
            int unmatched,
            int duplicates) {}
}
