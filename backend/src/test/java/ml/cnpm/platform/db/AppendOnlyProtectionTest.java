package ml.cnpm.platform.db;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Vérifie que les écritures financières validées ne peuvent être ni modifiées,
 * ni supprimées, ni tronquées.
 *
 * <p>{@code CLAUDE.md} l'impose : « Ne jamais modifier ou supprimer une écriture
 * financière validée ; utiliser une écriture compensatrice ». La garantie doit
 * tenir en base réelle : un test de service ne prouverait rien, puisqu'elle doit
 * résister aussi à un accès SQL direct.
 */
class AppendOnlyProtectionTest extends PostgresMigrationSupport {

    private static String jdbcUrl;

    @BeforeAll
    static void migrate() throws SQLException {
        jdbcUrl = migratedDatabase();
    }

    @Test
    @DisplayName("Un paiement enregistré ne peut pas être modifié")
    void paymentTransactionCannotBeUpdated() throws SQLException {
        String id = insertPaymentTransaction("TRX-UPDATE-001", "IDEM-UPDATE-001");

        assertThatThrownBy(
                        () ->
                                update(
                                        "UPDATE payment.payment_transaction SET amount = ? WHERE id = ?::uuid",
                                        new BigDecimal("1.00"),
                                        id))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("append-only");

        assertThat(amountOf("TRX-UPDATE-001")).isEqualByComparingTo("1500.00");
    }

    @Test
    @DisplayName("Un paiement enregistré ne peut pas être supprimé")
    void paymentTransactionCannotBeDeleted() throws SQLException {
        String id = insertPaymentTransaction("TRX-DELETE-001", "IDEM-DELETE-001");

        assertThatThrownBy(
                        () -> update("DELETE FROM payment.payment_transaction WHERE id = ?::uuid", id))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("append-only");

        assertThat(countPaymentTransactions("TRX-DELETE-001")).isEqualTo(1);
    }

    @Test
    @DisplayName("Un événement d'audit ne peut être ni modifié ni supprimé")
    void auditEventIsImmutable() throws SQLException {
        update(
                "INSERT INTO audit.audit_event (actor_type, action_code, entity_type) "
                        + "VALUES ('SYSTEM', 'TEST.APPEND.ONLY', 'TEST_ENTITY')");

        assertThatThrownBy(
                        () ->
                                update(
                                        "UPDATE audit.audit_event SET action_code = 'TAMPERED' "
                                                + "WHERE action_code = 'TEST.APPEND.ONLY'"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("append-only");

        assertThatThrownBy(
                        () ->
                                update(
                                        "DELETE FROM audit.audit_event WHERE action_code = 'TEST.APPEND.ONLY'"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("append-only");
    }

    @Test
    @DisplayName("Aucune table immuable ne peut être vidée par TRUNCATE")
    void noImmutableTableCanBeTruncated() {
        // Un trigger de niveau ligne ne se déclenche pas sur TRUNCATE : sans garde
        // dédiée, la protection append-only serait contournable par un seul ordre
        // SQL. TRUNCATE déclenchant le trigger même sur une table vide, les 19
        // tables sont ici réellement exercées, pas seulement dénombrées.
        //
        // CASCADE est délibéré : sans lui, PostgreSQL refuse d'abord le TRUNCATE
        // pour cause de clé étrangère, ce qui masquerait l'absence éventuelle de
        // garde derrière une objection incidente. CASCADE lève cette objection et
        // n'oppose donc que le trigger.
        for (String table : APPEND_ONLY_TABLES) {
            assertThatThrownBy(() -> update("TRUNCATE TABLE " + table + " CASCADE"))
                    .describedAs("TRUNCATE doit être refusé sur %s", table)
                    .isInstanceOf(SQLException.class)
                    .hasMessageContaining("TRUNCATE is forbidden");
        }
    }

    @Test
    @DisplayName("Deux paiements ne peuvent pas partager la même clé d'idempotence")
    void idempotencyKeyIsUnique() throws SQLException {
        insertPaymentTransaction("TRX-IDEM-001", "IDEM-SHARED-001");

        // Rejouer un callback partenaire ne doit jamais créer un second paiement.
        assertThatThrownBy(() -> insertPaymentTransaction("TRX-IDEM-002", "IDEM-SHARED-001"))
                .isInstanceOf(SQLException.class);

        assertThat(countPaymentTransactions("TRX-IDEM-002")).isZero();
    }

    @Test
    @DisplayName("Un paiement de montant négatif ou nul est refusé")
    void paymentAmountMustBePositive() {
        assertThatThrownBy(
                        () ->
                                insertPaymentTransaction(
                                        "TRX-NEGATIVE-001", "IDEM-NEGATIVE-001", new BigDecimal("-10.00")))
                .isInstanceOf(SQLException.class);

        assertThatThrownBy(
                        () ->
                                insertPaymentTransaction(
                                        "TRX-ZERO-001", "IDEM-ZERO-001", BigDecimal.ZERO))
                .isInstanceOf(SQLException.class);
    }

    /** L'insertion reste permise : seules modification, suppression et TRUNCATE sont refusées. */
    private String insertPaymentTransaction(String transactionNumber, String idempotencyKey)
            throws SQLException {
        return insertPaymentTransaction(transactionNumber, idempotencyKey, new BigDecimal("1500.00"));
    }

    private String insertPaymentTransaction(
            String transactionNumber, String idempotencyKey, BigDecimal amount) throws SQLException {
        update(
                "INSERT INTO payment.payment_transaction "
                        + "(transaction_number, channel, amount, paid_at, idempotency_key) "
                        + "VALUES (?, 'MOBILE_MONEY', ?, ?, ?)",
                transactionNumber,
                amount,
                Timestamp.from(Instant.parse("2026-01-15T10:00:00Z")),
                idempotencyKey);
        return queryString(
                "SELECT id::text FROM payment.payment_transaction WHERE transaction_number = ?",
                transactionNumber);
    }

    private BigDecimal amountOf(String transactionNumber) throws SQLException {
        try (Connection connection = connectTo(jdbcUrl);
                PreparedStatement statement =
                        connection.prepareStatement(
                                "SELECT amount FROM payment.payment_transaction "
                                        + "WHERE transaction_number = ?")) {
            statement.setString(1, transactionNumber);
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getBigDecimal(1);
            }
        }
    }

    private int countPaymentTransactions(String transactionNumber) throws SQLException {
        try (Connection connection = connectTo(jdbcUrl);
                PreparedStatement statement =
                        connection.prepareStatement(
                                "SELECT count(*) FROM payment.payment_transaction "
                                        + "WHERE transaction_number = ?")) {
            statement.setString(1, transactionNumber);
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getInt(1);
            }
        }
    }

    private static void update(String sql, Object... parameters) throws SQLException {
        try (Connection connection = connectTo(jdbcUrl)) {
            if (parameters.length == 0) {
                try (Statement statement = connection.createStatement()) {
                    statement.execute(sql);
                }
                return;
            }
            try (PreparedStatement statement = connection.prepareStatement(sql)) {
                bind(statement, parameters);
                statement.execute();
            }
        }
    }

    private static String queryString(String sql, Object... parameters) throws SQLException {
        try (Connection connection = connectTo(jdbcUrl);
                PreparedStatement statement = connection.prepareStatement(sql)) {
            bind(statement, parameters);
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getString(1);
            }
        }
    }

    private static void bind(PreparedStatement statement, Object... parameters) throws SQLException {
        for (int i = 0; i < parameters.length; i++) {
            statement.setObject(i + 1, parameters[i]);
        }
    }
}
