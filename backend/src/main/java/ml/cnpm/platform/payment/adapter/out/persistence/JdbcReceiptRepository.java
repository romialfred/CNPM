package ml.cnpm.platform.payment.adapter.out.persistence;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.payment.application.ReceiptView;
import ml.cnpm.platform.payment.application.port.out.ReceiptRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/**
 * Adaptateur sortant des reçus.
 *
 * <p>Table en ajout seul : écriture par insertion uniquement. Les lectures joignent
 * l'encaissement, sa référence puis {@code member.membership_list} pour porter le cotisant.
 */
@Repository
public class JdbcReceiptRepository implements ReceiptRepository {

    private static final String SELECT =
            "SELECT r.id, r.receipt_number, pt.transaction_number, pr.reference_value,"
                    + " ml.membership_number, ml.organization_legal_name, pt.channel, pt.amount,"
                    + " pt.currency, pt.paid_at, r.issued_at, r.status"
                    + " FROM receipt.receipt r"
                    + " JOIN payment.payment_transaction pt ON pt.id = r.payment_transaction_id"
                    + " LEFT JOIN payment.payment_reference pr ON pr.id = pt.payment_reference_id"
                    + " LEFT JOIN member.membership_list ml ON ml.id = pr.membership_id";

    private final JdbcTemplate jdbc;

    JdbcReceiptRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<ReceiptView.Receipt> findAll() {
        return jdbc.query(SELECT + " ORDER BY r.issued_at DESC", MAPPER);
    }

    @Override
    public Optional<ReceiptView.Receipt> findById(UUID id) {
        return first(jdbc.query(SELECT + " WHERE r.id = ?", MAPPER, id));
    }

    @Override
    public Optional<ReceiptView.Receipt> findIssuedByTransaction(UUID paymentTransactionId) {
        return first(
                jdbc.query(
                        SELECT + " WHERE r.payment_transaction_id = ? AND r.status = 'ISSUED'",
                        MAPPER,
                        paymentTransactionId));
    }

    @Override
    public Optional<ReceiptView.Verification> verifyByTokenHash(String tokenHash) {
        List<ReceiptView.Verification> rows =
                jdbc.query(
                        "SELECT r.receipt_number, ml.organization_legal_name, pt.amount, pt.currency,"
                                + " r.issued_at, r.status"
                                + " FROM receipt.receipt r"
                                + " JOIN payment.payment_transaction pt ON pt.id = r.payment_transaction_id"
                                + " LEFT JOIN payment.payment_reference pr ON pr.id = pt.payment_reference_id"
                                + " LEFT JOIN member.membership_list ml ON ml.id = pr.membership_id"
                                + " WHERE r.verification_token_hash = ? AND r.status = 'ISSUED'",
                        (rs, i) -> {
                            OffsetDateTime issuedAt = rs.getObject("issued_at", OffsetDateTime.class);
                            return new ReceiptView.Verification(
                                    true,
                                    rs.getString("receipt_number"),
                                    rs.getString("organization_legal_name"),
                                    rs.getBigDecimal("amount"),
                                    rs.getString("currency"),
                                    issuedAt == null ? null : issuedAt.toString(),
                                    rs.getString("status"));
                        },
                        tokenHash);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    @Override
    public Optional<String> transactionStatus(UUID paymentTransactionId) {
        List<String> rows =
                jdbc.query(
                        "SELECT status FROM payment.payment_transaction WHERE id = ?",
                        (rs, i) -> rs.getString("status"),
                        paymentTransactionId);
        return rows.isEmpty() ? Optional.empty() : Optional.ofNullable(rows.get(0));
    }

    @Override
    public ReceiptView.Receipt issue(
            UUID paymentTransactionId, String verificationTokenHash, UUID actorUserId) {
        UUID id =
                jdbc.queryForObject(
                        "INSERT INTO receipt.receipt (payment_transaction_id, receipt_number,"
                                + " issued_at, status, verification_token_hash, issued_by, created_by)"
                                + " VALUES (?, 'CNPM-REC-'"
                                + "   || lpad(nextval('receipt.receipt_number_seq')::text, 8, '0'),"
                                + "   now(), 'ISSUED', ?, ?, ?) RETURNING id",
                        UUID.class,
                        paymentTransactionId,
                        verificationTokenHash,
                        actorUserId,
                        actorUserId);
        return findById(id).orElseThrow();
    }

    private static Optional<ReceiptView.Receipt> first(List<ReceiptView.Receipt> rows) {
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    private static final RowMapper<ReceiptView.Receipt> MAPPER =
            (rs, i) -> {
                OffsetDateTime paidAt = rs.getObject("paid_at", OffsetDateTime.class);
                OffsetDateTime issuedAt = rs.getObject("issued_at", OffsetDateTime.class);
                return new ReceiptView.Receipt(
                        rs.getString("id"),
                        rs.getString("receipt_number"),
                        rs.getString("transaction_number"),
                        rs.getString("reference_value"),
                        rs.getString("membership_number"),
                        rs.getString("organization_legal_name"),
                        rs.getString("channel"),
                        rs.getBigDecimal("amount"),
                        rs.getString("currency"),
                        paidAt == null ? null : paidAt.toString(),
                        issuedAt == null ? null : issuedAt.toString(),
                        rs.getString("status"));
            };
}
