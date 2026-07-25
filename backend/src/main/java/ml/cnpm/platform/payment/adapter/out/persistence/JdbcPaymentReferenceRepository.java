package ml.cnpm.platform.payment.adapter.out.persistence;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.payment.application.PaymentReferenceView;
import ml.cnpm.platform.payment.application.port.out.PaymentReferenceRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/**
 * Adaptateur sortant des références de paiement.
 *
 * <p>Les lectures joignent {@code member.membership_list} (vue publique du module Membres) pour
 * porter le nom du cotisant. La numérotation lisible est produite en base à partir d'une
 * séquence dédiée, ce qui garantit l'unicité même sous écritures concurrentes.
 */
@Repository
public class JdbcPaymentReferenceRepository implements PaymentReferenceRepository {

    private static final String SELECT =
            "SELECT pr.id, pr.membership_id, ml.membership_number, ml.organization_legal_name,"
                    + " pr.reference_value, pr.exercise, pr.status, pr.approved_at, pr.created_at"
                    + " FROM payment.payment_reference pr"
                    + " LEFT JOIN member.membership_list ml ON ml.id = pr.membership_id";

    private final JdbcTemplate jdbc;

    JdbcPaymentReferenceRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<PaymentReferenceView.Reference> findAll() {
        // Les références à valider en tête, puis les plus récentes.
        return jdbc.query(
                SELECT + " ORDER BY (pr.status = 'PENDING_VALIDATION') DESC, pr.created_at DESC",
                MAPPER);
    }

    @Override
    public Optional<PaymentReferenceView.Reference> findById(UUID id) {
        return first(jdbc.query(SELECT + " WHERE pr.id = ?", MAPPER, id));
    }

    @Override
    public Optional<PaymentReferenceView.Reference> findLive(UUID membershipId, int exercise) {
        return first(
                jdbc.query(
                        SELECT
                                + " WHERE pr.membership_id = ? AND pr.exercise = ?"
                                + " AND pr.status <> 'REVOKED'",
                        MAPPER,
                        membershipId,
                        exercise));
    }

    @Override
    public boolean membershipExists(UUID membershipId) {
        Integer count =
                jdbc.queryForObject(
                        "SELECT count(*) FROM member.membership_list WHERE id = ?",
                        Integer.class,
                        membershipId);
        return count != null && count > 0;
    }

    @Override
    public PaymentReferenceView.Reference generate(UUID membershipId, int exercise, UUID actorUserId) {
        UUID id =
                jdbc.queryForObject(
                        "INSERT INTO payment.payment_reference (membership_id, exercise,"
                                + " reference_value, status, created_by, updated_by)"
                                + " VALUES (?, ?, 'CNPM-COT-' || ?::text || '-'"
                                + "   || lpad(nextval('payment.payment_reference_number_seq')::text, 6, '0'),"
                                + "   'PENDING_VALIDATION', ?, ?) RETURNING id",
                        UUID.class,
                        membershipId,
                        exercise,
                        exercise,
                        actorUserId,
                        actorUserId);
        return findById(id).orElseThrow();
    }

    @Override
    public PaymentReferenceView.Reference validate(UUID id, UUID actorUserId) {
        jdbc.update(
                "UPDATE payment.payment_reference SET status = 'VALIDATED', approved_by = ?,"
                        + " approved_at = now(), updated_at = now(), updated_by = ?,"
                        + " version = version + 1 WHERE id = ?",
                actorUserId,
                actorUserId,
                id);
        return findById(id).orElseThrow();
    }

    @Override
    public PaymentReferenceView.Reference revoke(UUID id, UUID actorUserId) {
        jdbc.update(
                "UPDATE payment.payment_reference SET status = 'REVOKED', updated_at = now(),"
                        + " updated_by = ?, version = version + 1 WHERE id = ?",
                actorUserId,
                id);
        return findById(id).orElseThrow();
    }

    private static Optional<PaymentReferenceView.Reference> first(
            List<PaymentReferenceView.Reference> rows) {
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    private static final RowMapper<PaymentReferenceView.Reference> MAPPER =
            (rs, i) -> {
                OffsetDateTime approvedAt = rs.getObject("approved_at", OffsetDateTime.class);
                OffsetDateTime createdAt = rs.getObject("created_at", OffsetDateTime.class);
                Integer exercise = rs.getObject("exercise", Integer.class);
                return new PaymentReferenceView.Reference(
                        rs.getString("id"),
                        rs.getString("membership_id"),
                        rs.getString("membership_number"),
                        rs.getString("organization_legal_name"),
                        rs.getString("reference_value"),
                        exercise,
                        rs.getString("status"),
                        approvedAt == null ? null : approvedAt.toString(),
                        createdAt == null ? null : createdAt.toString());
            };
}
