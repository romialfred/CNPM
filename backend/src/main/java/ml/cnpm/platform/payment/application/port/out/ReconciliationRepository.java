package ml.cnpm.platform.payment.application.port.out;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.payment.application.ReconciliationView;

/**
 * Port sortant du rapprochement, sur le schéma {@code payment}.
 *
 * <p>Les lignes de relevé sont en ajout seul et dédoublonnées par empreinte ; les cas de
 * rapprochement, eux, évoluent (proposé → confirmé/rejeté).
 */
public interface ReconciliationRepository {

    UUID createStatement(
            String bankCode,
            String statementRef,
            String accountRefMasked,
            LocalDate periodStart,
            LocalDate periodEnd,
            UUID actorUserId);

    /** Insère une ligne ; renvoie vide si une ligne de même empreinte existe déjà (doublon). */
    Optional<UUID> insertLine(
            UUID statementId,
            int lineNumber,
            LocalDate bookingDate,
            LocalDate valueDate,
            BigDecimal amount,
            String referenceText,
            String fingerprint,
            UUID actorUserId);

    /** Identifiant d'une référence VALIDÉE portant cette valeur, si elle existe. */
    Optional<UUID> findValidatedReferenceByValue(String referenceValue);

    void createCase(
            UUID statementLineId,
            UUID matchedReferenceId,
            BigDecimal matchScore,
            String status,
            UUID actorUserId);

    List<ReconciliationView.Case> findAll();

    /** Données nécessaires à la décision sur un cas. */
    Optional<CaseDecision> findForDecision(UUID caseId);

    /**
     * Confirme un cas : crée l'encaissement (ajout seul, idempotent par clé) contre la référence
     * appariée et lie le cas à cette transaction.
     */
    void confirm(
            UUID caseId,
            UUID matchedReferenceId,
            BigDecimal amount,
            LocalDate bookingDate,
            String providerReference,
            String idempotencyKey,
            UUID actorUserId);

    void reject(UUID caseId, UUID actorUserId);

    /** Vue interne pour décider : état, référence appariée, montant et libellé de la ligne. */
    record CaseDecision(
            String status,
            UUID matchedReferenceId,
            BigDecimal amount,
            LocalDate bookingDate,
            String referenceText) {}
}
