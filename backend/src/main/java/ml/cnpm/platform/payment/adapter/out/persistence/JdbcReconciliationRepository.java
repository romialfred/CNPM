package ml.cnpm.platform.payment.adapter.out.persistence;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.payment.application.ReconciliationView;
import ml.cnpm.platform.payment.application.port.out.ReconciliationRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/**
 * Adaptateur sortant du rapprochement.
 *
 * <p>Les lignes de relevé sont en ajout seul et dédoublonnées par empreinte (violation d'unicité
 * traduite en « doublon »). La confirmation d'un cas écrit l'encaissement en ajout seul, sous une
 * clé d'idempotence dérivée du cas, puis lie le cas à la transaction.
 */
@Repository
public class JdbcReconciliationRepository implements ReconciliationRepository {

    private final JdbcTemplate jdbc;

    JdbcReconciliationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public UUID createStatement(
            String bankCode,
            String statementRef,
            String accountRefMasked,
            LocalDate periodStart,
            LocalDate periodEnd,
            UUID actorUserId) {
        // La référence de relevé est unique : réimporter le même relevé RÉUTILISE son en-tête
        // (les lignes se dédoublonnent ensuite par empreinte). ON CONFLICT évite l'exception qui
        // invaliderait la transaction d'import.
        List<UUID> inserted =
                jdbc.query(
                        "INSERT INTO payment.bank_statement (bank_code, account_ref_masked,"
                                + " statement_ref, period_start, period_end, status, created_by,"
                                + " updated_by) VALUES (?, ?, ?, ?, ?, 'IMPORTED', ?, ?)"
                                + " ON CONFLICT (statement_ref) DO NOTHING RETURNING id",
                        (rs, i) -> rs.getObject("id", UUID.class),
                        bankCode,
                        accountRefMasked,
                        statementRef,
                        periodStart,
                        periodEnd,
                        actorUserId,
                        actorUserId);
        if (!inserted.isEmpty()) {
            return inserted.get(0);
        }
        return jdbc.queryForObject(
                "SELECT id FROM payment.bank_statement WHERE statement_ref = ?",
                UUID.class,
                statementRef);
    }

    @Override
    public Optional<UUID> insertLine(
            UUID statementId,
            int lineNumber,
            LocalDate bookingDate,
            LocalDate valueDate,
            BigDecimal amount,
            String referenceText,
            String fingerprint,
            UUID actorUserId) {
        // ON CONFLICT plutôt qu'un try/catch : une exception SQL capturée à l'intérieur d'une
        // transaction la marque « rollback-only » et ferait échouer l'import entier au commit.
        // Ici, un doublon d'empreinte ne renvoie aucune ligne, sans lever d'exception.
        List<UUID> inserted =
                jdbc.query(
                        "INSERT INTO payment.bank_statement_line (statement_id, line_number,"
                                + " booking_date, value_date, amount, reference_text, fingerprint,"
                                + " created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
                                + " ON CONFLICT (fingerprint) DO NOTHING RETURNING id",
                        (rs, i) -> rs.getObject("id", UUID.class),
                        statementId,
                        lineNumber,
                        bookingDate,
                        valueDate,
                        amount,
                        referenceText,
                        fingerprint,
                        actorUserId);
        return inserted.isEmpty() ? Optional.empty() : Optional.ofNullable(inserted.get(0));
    }

    @Override
    public Optional<UUID> findValidatedReferenceByValue(String referenceValue) {
        List<UUID> rows =
                jdbc.query(
                        "SELECT id FROM payment.payment_reference"
                                + " WHERE reference_value = ? AND status = 'VALIDATED'",
                        (rs, i) -> rs.getObject("id", UUID.class),
                        referenceValue);
        return rows.isEmpty() ? Optional.empty() : Optional.ofNullable(rows.get(0));
    }

    @Override
    public void createCase(
            UUID statementLineId,
            UUID matchedReferenceId,
            BigDecimal matchScore,
            String status,
            UUID actorUserId) {
        jdbc.update(
                "INSERT INTO payment.reconciliation_case (statement_line_id, matched_reference_id,"
                        + " match_score, status, proposed_by, created_by, updated_by)"
                        + " VALUES (?, ?, ?, ?, ?, ?, ?)",
                statementLineId,
                matchedReferenceId,
                matchScore,
                status,
                actorUserId,
                actorUserId,
                actorUserId);
    }

    @Override
    public List<ReconciliationView.Case> findAll() {
        return jdbc.query(
                "SELECT rc.id, bl.booking_date, bl.amount, bl.reference_text, rc.match_score,"
                        + " rc.status, pr.reference_value, ml.membership_number,"
                        + " ml.organization_legal_name, pt.transaction_number"
                        + " FROM payment.reconciliation_case rc"
                        + " JOIN payment.bank_statement_line bl ON bl.id = rc.statement_line_id"
                        + " LEFT JOIN payment.payment_reference pr ON pr.id = rc.matched_reference_id"
                        + " LEFT JOIN member.membership_list ml ON ml.id = pr.membership_id"
                        + " LEFT JOIN payment.payment_transaction pt ON pt.id = rc.payment_transaction_id"
                        + " ORDER BY (rc.status = 'PROPOSED') DESC, rc.created_at DESC",
                CASE_MAPPER);
    }

    @Override
    public Optional<CaseDecision> findForDecision(UUID caseId) {
        List<CaseDecision> rows =
                jdbc.query(
                        "SELECT rc.status, rc.matched_reference_id, bl.amount, bl.booking_date,"
                                + " bl.reference_text"
                                + " FROM payment.reconciliation_case rc"
                                + " JOIN payment.bank_statement_line bl ON bl.id = rc.statement_line_id"
                                + " WHERE rc.id = ?",
                        (rs, i) ->
                                new CaseDecision(
                                        rs.getString("status"),
                                        rs.getObject("matched_reference_id", UUID.class),
                                        rs.getBigDecimal("amount"),
                                        rs.getObject("booking_date", LocalDate.class),
                                        rs.getString("reference_text")),
                        caseId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    @Override
    public void confirm(
            UUID caseId,
            UUID matchedReferenceId,
            BigDecimal amount,
            LocalDate bookingDate,
            String providerReference,
            String idempotencyKey,
            UUID actorUserId) {
        OffsetDateTime paidAt = bookingDate.atStartOfDay().atOffset(ZoneOffset.UTC);
        String provider =
                providerReference == null
                        ? null
                        : providerReference.substring(0, Math.min(providerReference.length(), 160));
        // ON CONFLICT sur la clé d'idempotence : un double-confirm concurrent ne crée qu'un
        // encaissement, sans exception qui invaliderait la transaction.
        List<UUID> inserted =
                jdbc.query(
                        "INSERT INTO payment.payment_transaction (payment_reference_id,"
                                + " transaction_number, provider_transaction_id, channel, amount,"
                                + " currency, paid_at, status, idempotency_key, created_by)"
                                + " VALUES (?, 'CNPM-PAY-'"
                                + "   || lpad(nextval('payment.payment_transaction_number_seq')::text, 8, '0'),"
                                + "   ?, 'BANK_TRANSFER', ?, 'XOF', ?, 'RECEIVED', ?, ?)"
                                + " ON CONFLICT (idempotency_key) DO NOTHING RETURNING id",
                        (rs, i) -> rs.getObject("id", UUID.class),
                        matchedReferenceId,
                        provider,
                        amount,
                        paidAt,
                        idempotencyKey,
                        actorUserId);
        UUID transactionId =
                inserted.isEmpty()
                        ? jdbc.queryForObject(
                                "SELECT id FROM payment.payment_transaction WHERE idempotency_key = ?",
                                UUID.class,
                                idempotencyKey)
                        : inserted.get(0);

        jdbc.update(
                "UPDATE payment.reconciliation_case SET payment_transaction_id = ?, status = 'CONFIRMED',"
                        + " approved_by = ?, updated_at = now(), updated_by = ?, version = version + 1"
                        + " WHERE id = ?",
                transactionId,
                actorUserId,
                actorUserId,
                caseId);
    }

    @Override
    public void reject(UUID caseId, UUID actorUserId) {
        jdbc.update(
                "UPDATE payment.reconciliation_case SET status = 'REJECTED', approved_by = ?,"
                        + " updated_at = now(), updated_by = ?, version = version + 1 WHERE id = ?",
                actorUserId,
                actorUserId,
                caseId);
    }

    private static final RowMapper<ReconciliationView.Case> CASE_MAPPER =
            (rs, i) -> {
                LocalDate bookingDate = rs.getObject("booking_date", LocalDate.class);
                return new ReconciliationView.Case(
                        rs.getString("id"),
                        bookingDate == null ? null : bookingDate.toString(),
                        rs.getBigDecimal("amount"),
                        "XOF",
                        rs.getString("reference_text"),
                        rs.getBigDecimal("match_score"),
                        rs.getString("status"),
                        rs.getString("reference_value"),
                        rs.getString("membership_number"),
                        rs.getString("organization_legal_name"),
                        rs.getString("transaction_number"));
            };
}
