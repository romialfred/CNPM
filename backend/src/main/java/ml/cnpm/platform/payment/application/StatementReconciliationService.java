package ml.cnpm.platform.payment.application;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.payment.application.port.out.ReconciliationRepository;
import ml.cnpm.platform.payment.application.port.out.ReconciliationRepository.CaseDecision;
import ml.cnpm.platform.shared.api.Hashing;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Rapprochement automatique des encaissements à partir d'un relevé importé (Lot 5).
 *
 * <p><b>Appariement.</b> Pour chaque ligne, le service lit la référence de paiement dans le
 * libellé et l'apparie au cotisant lorsqu'elle correspond à une référence VALIDÉE : c'est un
 * appariement EXACT (score 100), qui ne dépend d'aucun seuil de confiance. Les lignes sans
 * référence exploitable sont isolées en « non rapproché » — l'appariement flou par montant,
 * tributaire des seuils encore à trancher (FIN-DEC-001), n'est délibérément pas activé.
 *
 * <p><b>Souveraineté.</b> Un appariement proposé n'écrit rien de financier : c'est la décision
 * de la CNPM qui, en confirmant, crée l'encaissement (ajout seul, idempotent). Les doublons de
 * ligne sont écartés par empreinte. Chaque action est auditée.
 */
@Service
public class StatementReconciliationService {

    /** La référence CNPM lue dans un libellé de relevé. */
    private static final Pattern REFERENCE = Pattern.compile("CNPM-COT-\\d{4}-\\d{6}");
    private static final BigDecimal EXACT_SCORE = new BigDecimal("100.00");

    private static final String ENTITY_STATEMENT = "payment.bank_statement";
    private static final String ENTITY_CASE = "payment.reconciliation_case";
    private static final String ACTION_IMPORTED = "BANK_STATEMENT.IMPORTED";
    private static final String ACTION_CONFIRMED = "RECONCILIATION.CONFIRMED";
    private static final String ACTION_REJECTED = "RECONCILIATION.REJECTED";

    private final ReconciliationRepository repository;
    private final AuditRecorder auditRecorder;

    StatementReconciliationService(
            ReconciliationRepository repository, AuditRecorder auditRecorder) {
        this.repository = repository;
        this.auditRecorder = auditRecorder;
    }

    /**
     * Importe un relevé et apparie ses lignes. Ne crée aucun encaissement : seuls des cas de
     * rapprochement sont proposés, à confirmer par la CNPM.
     */
    @PreAuthorize("hasAuthority('PERM_PAYMENT.RECORD')")
    @Transactional
    public ReconciliationView.ImportSummary importStatement(
            StatementImportCommand command, UUID actorUserId, UUID correlationId) {
        UUID statementId =
                repository.createStatement(
                        command.bankCode(),
                        command.statementRef(),
                        command.accountRefMasked(),
                        command.periodStart(),
                        command.periodEnd(),
                        actorUserId);

        int imported = 0;
        int matched = 0;
        int unmatched = 0;
        int duplicates = 0;

        for (StatementImportCommand.Line line : command.lines()) {
            String fingerprint =
                    Hashing.sha256Hex(
                            String.join(
                                    "|",
                                    command.statementRef(),
                                    String.valueOf(line.lineNumber()),
                                    String.valueOf(line.bookingDate()),
                                    String.valueOf(line.amount()),
                                    String.valueOf(line.referenceText())));
            Optional<UUID> lineId =
                    repository.insertLine(
                            statementId,
                            line.lineNumber(),
                            line.bookingDate(),
                            line.valueDate(),
                            line.amount(),
                            line.referenceText(),
                            fingerprint,
                            actorUserId);
            if (lineId.isEmpty()) {
                duplicates++;
                continue;
            }
            imported++;

            Optional<UUID> referenceId =
                    extractReference(line.referenceText())
                            .flatMap(repository::findValidatedReferenceByValue);
            if (referenceId.isPresent()) {
                repository.createCase(
                        lineId.get(), referenceId.get(), EXACT_SCORE, "PROPOSED", actorUserId);
                matched++;
            } else {
                repository.createCase(lineId.get(), null, null, "UNMATCHED", actorUserId);
                unmatched++;
            }
        }

        auditRecorder.record(
                AuditEntry.created(
                        actorUserId,
                        ACTION_IMPORTED,
                        ENTITY_STATEMENT,
                        statementId,
                        Hashing.sha256Hex(
                                command.statementRef() + "|" + imported + "|" + matched + "|" + unmatched),
                        correlationId));
        return new ReconciliationView.ImportSummary(
                statementId.toString(), command.statementRef(), imported, matched, unmatched, duplicates);
    }

    @PreAuthorize("hasAuthority('PERM_PAYMENT.READ')")
    @Transactional(readOnly = true)
    public ReconciliationView.CaseList list() {
        return new ReconciliationView.CaseList(repository.findAll());
    }

    /**
     * Décision de la CNPM sur un cas : confirmer l'appariement (l'encaissement est alors créé) ou
     * le rejeter.
     *
     * @throws ResourceNotFoundException si le cas n'existe pas
     * @throws StateConflictException si le cas n'est pas en attente, ou si une confirmation porte
     *     sur un cas sans référence appariée
     */
    @PreAuthorize("hasAuthority('PERM_PAYMENT.RECORD')")
    @Transactional
    public ReconciliationOutcome decide(
            UUID caseId, boolean confirm, String reason, UUID actorUserId, UUID correlationId) {
        CaseDecision decision =
                repository
                        .findForDecision(caseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Cas de rapprochement introuvable."));
        if (!"PROPOSED".equals(decision.status())) {
            throw new StateConflictException("Seul un cas proposé peut être décidé.");
        }

        if (!confirm) {
            String safeReason = reason == null ? "" : reason.trim();
            repository.reject(caseId, actorUserId);
            auditRecorder.record(
                    new AuditEntry(
                            "USER",
                            actorUserId,
                            ACTION_REJECTED,
                            ENTITY_CASE,
                            caseId,
                            Hashing.sha256Hex(caseId.toString()),
                            Hashing.sha256Hex(caseId + "|REJECTED|" + safeReason),
                            correlationId));
            return new ReconciliationOutcome("REJECTED");
        }

        if (decision.matchedReferenceId() == null) {
            throw new StateConflictException("Ce cas n’a aucune référence appariée à confirmer.");
        }
        // Clé d'idempotence dérivée du cas : confirmer deux fois n'écrit qu'un encaissement.
        repository.confirm(
                caseId,
                decision.matchedReferenceId(),
                decision.amount(),
                decision.bookingDate(),
                decision.referenceText(),
                "RECON-" + caseId,
                actorUserId);
        auditRecorder.record(
                new AuditEntry(
                        "USER",
                        actorUserId,
                        ACTION_CONFIRMED,
                        ENTITY_CASE,
                        caseId,
                        Hashing.sha256Hex(caseId.toString()),
                        Hashing.sha256Hex(caseId + "|CONFIRMED"),
                        correlationId));
        return new ReconciliationOutcome("CONFIRMED");
    }

    private static Optional<String> extractReference(String referenceText) {
        if (referenceText == null) {
            return Optional.empty();
        }
        Matcher matcher = REFERENCE.matcher(referenceText);
        return matcher.find() ? Optional.of(matcher.group()) : Optional.empty();
    }

    /** Issue d'une décision de rapprochement. */
    public record ReconciliationOutcome(String status) {}
}
