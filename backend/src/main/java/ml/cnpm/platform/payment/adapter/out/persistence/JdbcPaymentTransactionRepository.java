package ml.cnpm.platform.payment.adapter.out.persistence;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.payment.application.PaymentTransactionView;
import ml.cnpm.platform.payment.application.port.out.PaymentTransactionRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/**
 * Adaptateur sortant des encaissements.
 *
 * <p>La table est en ajout seul : cet adaptateur n'écrit que par insertion. Les lectures
 * joignent la référence puis {@code member.membership_list} pour porter le nom du cotisant.
 */
@Repository
public class JdbcPaymentTransactionRepository implements PaymentTransactionRepository {

    private static final String SELECT =
            "SELECT pt.id, pt.transaction_number, pr.reference_value, ml.membership_number,"
                    + " ml.organization_legal_name, pt.channel, pt.amount, pt.currency, pt.paid_at,"
                    + " pt.status, pt.created_at"
                    + " FROM payment.payment_transaction pt"
                    + " LEFT JOIN payment.payment_reference pr ON pr.id = pt.payment_reference_id"
                    + " LEFT JOIN member.membership_list ml ON ml.id = pr.membership_id";

    private final JdbcTemplate jdbc;

    JdbcPaymentTransactionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<PaymentTransactionView.Payment> findAll() {
        return jdbc.query(SELECT + " ORDER BY pt.paid_at DESC, pt.created_at DESC", MAPPER);
    }

    @Override
    public Optional<PaymentTransactionView.Payment> findById(UUID id) {
        return first(jdbc.query(SELECT + " WHERE pt.id = ?", MAPPER, id));
    }

    @Override
    public Optional<PaymentTransactionView.Payment> findByIdempotencyKey(String idempotencyKey) {
        return first(jdbc.query(SELECT + " WHERE pt.idempotency_key = ?", MAPPER, idempotencyKey));
    }

    @Override
    public Optional<String> referenceStatus(UUID referenceId) {
        List<String> rows =
                jdbc.query(
                        "SELECT status FROM payment.payment_reference WHERE id = ?",
                        (rs, i) -> rs.getString("status"),
                        referenceId);
        return rows.isEmpty() ? Optional.empty() : Optional.ofNullable(rows.get(0));
    }

    @Override
    public PaymentTransactionView.Payment record(
            UUID referenceId,
            String channel,
            BigDecimal amount,
            OffsetDateTime paidAt,
            String providerTransactionId,
            String idempotencyKey,
            UUID actorUserId) {
        UUID id =
                jdbc.queryForObject(
                        "INSERT INTO payment.payment_transaction (payment_reference_id,"
                                + " transaction_number, provider_transaction_id, channel, amount,"
                                + " currency, paid_at, status, idempotency_key, created_by)"
                                + " VALUES (?, 'CNPM-PAY-'"
                                + "   || lpad(nextval('payment.payment_transaction_number_seq')::text, 8, '0'),"
                                + "   ?, ?, ?, 'XOF', ?, 'RECEIVED', ?, ?) RETURNING id",
                        UUID.class,
                        referenceId,
                        providerTransactionId,
                        channel,
                        amount,
                        paidAt,
                        idempotencyKey,
                        actorUserId);
        return findById(id).orElseThrow();
    }

    private static Optional<PaymentTransactionView.Payment> first(
            List<PaymentTransactionView.Payment> rows) {
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    private static final RowMapper<PaymentTransactionView.Payment> MAPPER =
            (rs, i) -> {
                OffsetDateTime paidAt = rs.getObject("paid_at", OffsetDateTime.class);
                OffsetDateTime createdAt = rs.getObject("created_at", OffsetDateTime.class);
                return new PaymentTransactionView.Payment(
                        rs.getString("id"),
                        rs.getString("transaction_number"),
                        rs.getString("reference_value"),
                        rs.getString("membership_number"),
                        rs.getString("organization_legal_name"),
                        rs.getString("channel"),
                        rs.getBigDecimal("amount"),
                        rs.getString("currency"),
                        paidAt == null ? null : paidAt.toString(),
                        rs.getString("status"),
                        createdAt == null ? null : createdAt.toString());
            };
}
