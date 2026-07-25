package ml.cnpm.platform.contribution.application;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.util.List;

/**
 * Projection « mes cotisations » destinée à l'espace membre (PRT-006).
 *
 * <p>Vue en lecture seule et strictement bornée à l'adhésion du compte appelant. Les
 * montants sont des {@code numeric(19,2)} rendus tels quels : aucun arrondi, aucun calcul
 * de barème ici — la projection lit ce que le module cotisations a écrit.
 *
 * <p><b>Montants sérialisés en CHAÎNE</b> ({@link JsonFormat}), comme le déclare le schéma
 * {@code Money} du contrat. Un montant écrit en nombre JSON redevient un {@code double} dès
 * qu'un navigateur le lit, ce que {@code CLAUDE.md} interdit pour une valeur financière ; la
 * chaîne conserve en outre l'échelle exacte — « 0.00 » reste « 0.00 » et non « 0.0 ».
 */
public record MemberContributionView() {

    /**
     * État d'un appel du point de vue du membre.
     *
     * <p>Dérivation d'affichage, pas une règle métier nouvelle : {@code REGLEE} quand le
     * solde est nul, {@code EN_RETARD} quand l'échéance est dépassée et qu'il reste un
     * solde, {@code PARTIELLE} quand un paiement a déjà réduit le solde sans l'éteindre, et
     * {@code A_ECHOIR} sinon. Le retard prime sur le partiel : un appel en retard doit se
     * lire comme tel, même partiellement réglé.
     */
    public record Summary(
            String id,
            String reference,
            int exercise,
            String dueDate,
            @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal calledAmount,
            @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal paidAmount,
            @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal outstandingAmount,
            String currency,
            String status) { }

    public record Installment(
            String id,
            String label,
            String dueDate,
            @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal expectedAmount,
            @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal paidAmount,
            @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal outstandingAmount,
            String currency,
            String status) { }

    /** Ajustement appliqué à un appel. {@code direction} vaut CREDIT ou DEBIT. */
    public record Adjustment(
            String reference,
            String direction,
            @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal amount,
            String currency,
            String reason,
            String recordedOn) { }

    public record Detail(
            String id,
            String reference,
            int exercise,
            String dueDate,
            @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal calledAmount,
            @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal paidAmount,
            @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal outstandingAmount,
            String currency,
            String status,
            String issuedOn,
            String amountOriginNote,
            List<Adjustment> adjustments,
            List<Installment> schedule) { }

    /**
     * Page d'appels.
     *
     * @param availableExercises exercices réellement présents pour cette adhésion, pour
     *     alimenter le filtre sans proposer une année vide
     */
    public record Page(
            List<Summary> items,
            int page,
            int size,
            long totalElements,
            int totalPages,
            List<Integer> availableExercises) { }
}
