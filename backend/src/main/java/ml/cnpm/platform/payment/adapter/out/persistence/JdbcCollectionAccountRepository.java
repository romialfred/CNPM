package ml.cnpm.platform.payment.adapter.out.persistence;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.payment.application.CollectionAccountDraft;
import ml.cnpm.platform.payment.application.CollectionAccountView;
import ml.cnpm.platform.payment.application.port.out.CollectionAccountRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/**
 * Adaptateur sortant des comptes d'encaissement, sur le schéma {@code payment}.
 *
 * <p>Toutes les lectures partagent la même projection : après une écriture, le service relit
 * l'état persisté et le renvoie tel quel, sans le reconstruire de mémoire.
 */
@Repository
public class JdbcCollectionAccountRepository implements CollectionAccountRepository {

    private static final String SELECT =
            "SELECT id, channel, label, account_holder, account_identifier, bank_name,"
                    + " instructions, status, approved_at, created_at"
                    + " FROM payment.collection_account";

    private final JdbcTemplate jdbc;

    JdbcCollectionAccountRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<CollectionAccountView.Account> findAll() {
        // Les brouillons en tête, puis par canal et libellé : l'agent voit d'abord ce qui
        // attend une validation.
        return jdbc.query(
                SELECT
                        + " ORDER BY (status = 'DRAFT') DESC, channel, label, created_at",
                MAPPER);
    }

    @Override
    public Optional<CollectionAccountView.Account> findById(UUID id) {
        return first(jdbc.query(SELECT + " WHERE id = ?", MAPPER, id));
    }

    @Override
    public boolean existsByChannelAndIdentifier(String channel, String identifier) {
        Integer count =
                jdbc.queryForObject(
                        "SELECT count(*) FROM payment.collection_account"
                                + " WHERE channel = ? AND account_identifier = ?",
                        Integer.class,
                        channel,
                        identifier);
        return count != null && count > 0;
    }

    @Override
    public Optional<UUID> creatorOf(UUID id) {
        List<UUID> rows =
                jdbc.query(
                        "SELECT created_by FROM payment.collection_account WHERE id = ?",
                        (rs, i) -> rs.getObject("created_by", UUID.class),
                        id);
        return rows.isEmpty() ? Optional.empty() : Optional.ofNullable(rows.get(0));
    }

    @Override
    public CollectionAccountView.Account create(CollectionAccountDraft draft, UUID actorUserId) {
        UUID id =
                jdbc.queryForObject(
                        "INSERT INTO payment.collection_account (channel, label, account_holder,"
                                + " account_identifier, bank_name, instructions, status,"
                                + " created_by, updated_by)"
                                + " VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?) RETURNING id",
                        UUID.class,
                        draft.channel(),
                        draft.label(),
                        draft.accountHolder(),
                        draft.accountIdentifier(),
                        draft.bankName(),
                        draft.instructions(),
                        actorUserId,
                        actorUserId);
        return findById(id).orElseThrow();
    }

    @Override
    public CollectionAccountView.Account approve(UUID id, UUID actorUserId) {
        jdbc.update(
                "UPDATE payment.collection_account SET status = 'ACTIVE', approved_by = ?,"
                        + " approved_at = now(), updated_at = now(), updated_by = ?,"
                        + " version = version + 1 WHERE id = ?",
                actorUserId,
                actorUserId,
                id);
        return findById(id).orElseThrow();
    }

    @Override
    public CollectionAccountView.Account disable(UUID id, UUID actorUserId) {
        jdbc.update(
                "UPDATE payment.collection_account SET status = 'DISABLED', updated_at = now(),"
                        + " updated_by = ?, version = version + 1 WHERE id = ?",
                actorUserId,
                id);
        return findById(id).orElseThrow();
    }

    private static Optional<CollectionAccountView.Account> first(
            List<CollectionAccountView.Account> rows) {
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    private static final RowMapper<CollectionAccountView.Account> MAPPER =
            (rs, i) -> {
                OffsetDateTime approvedAt = rs.getObject("approved_at", OffsetDateTime.class);
                OffsetDateTime createdAt = rs.getObject("created_at", OffsetDateTime.class);
                return new CollectionAccountView.Account(
                        rs.getString("id"),
                        rs.getString("channel"),
                        rs.getString("label"),
                        rs.getString("account_holder"),
                        rs.getString("account_identifier"),
                        rs.getString("bank_name"),
                        rs.getString("instructions"),
                        rs.getString("status"),
                        approvedAt == null ? null : approvedAt.toString(),
                        createdAt == null ? null : createdAt.toString());
            };
}
