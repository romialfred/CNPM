package ml.cnpm.platform.db;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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

/** Vérifie l'immutabilité de l'enveloppe outbox et le cycle de livraison introduit par V10. */
class OutboxDeliveryProtectionTest extends PostgresMigrationSupport {

    private static String jdbcUrl;

    @BeforeAll
    static void migrate() throws SQLException {
        jdbcUrl = migratedDatabase();
    }

    @Test
    @DisplayName("Le publisher peut planifier puis publier un événement sans modifier son enveloppe")
    void deliveryMetadataCanAdvanceUntilPublished() throws SQLException {
        String id = insertOutboxEvent("TEST.OUTBOX.DELIVERY");
        Timestamp retryAt = Timestamp.from(Instant.parse("2026-07-18T12:00:00Z"));
        Timestamp publishedAt = Timestamp.from(Instant.parse("2026-07-18T12:01:00Z"));

        update(
                "UPDATE integration.outbox_event SET available_at = ? WHERE id = ?::uuid",
                retryAt,
                id);

        assertThat(statusOf(id)).isEqualTo("NEW");
        assertThat(availableAtOf(id)).isEqualTo(retryAt);

        update(
                "UPDATE integration.outbox_event SET status = 'PUBLISHED', published_at = ? "
                        + "WHERE id = ?::uuid",
                publishedAt,
                id);

        assertThat(statusOf(id)).isEqualTo("PUBLISHED");
        assertThat(publishedAtOf(id)).isEqualTo(publishedAt);
    }

    @Test
    @DisplayName("L'enveloppe métier d'un événement outbox reste append-only")
    void eventEnvelopeCannotBeChangedOrDeleted() throws SQLException {
        String id = insertOutboxEvent("TEST.OUTBOX.IMMUTABLE");

        assertThatThrownBy(
                        () ->
                                update(
                                        "UPDATE integration.outbox_event "
                                                + "SET payload = '{\"version\":2}'::jsonb "
                                                + "WHERE id = ?::uuid",
                                        id))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("append-only");

        assertThatThrownBy(
                        () ->
                                update(
                                        "DELETE FROM integration.outbox_event WHERE id = ?::uuid",
                                        id))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("append-only");

        assertThat(countById(id)).isEqualTo(1);
    }

    @Test
    @DisplayName("Un événement publié est terminal et son horodatage ne peut être réécrit")
    void publishedEventIsTerminal() throws SQLException {
        String id = insertOutboxEvent("TEST.OUTBOX.TERMINAL");
        Timestamp publishedAt = Timestamp.from(Instant.parse("2026-07-18T12:01:00Z"));

        update(
                "UPDATE integration.outbox_event SET status = 'PUBLISHED', published_at = ? "
                        + "WHERE id = ?::uuid",
                publishedAt,
                id);

        assertThatThrownBy(
                        () ->
                                update(
                                        "UPDATE integration.outbox_event SET status = 'NEW' "
                                                + "WHERE id = ?::uuid",
                                        id))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("terminal");

        assertThatThrownBy(
                        () ->
                                update(
                                        "UPDATE integration.outbox_event SET published_at = ? "
                                                + "WHERE id = ?::uuid",
                                        Timestamp.from(Instant.parse("2026-07-18T12:02:00Z")),
                                        id))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("terminal");

        assertThat(statusOf(id)).isEqualTo("PUBLISHED");
        assertThat(publishedAtOf(id)).isEqualTo(publishedAt);
    }

    @Test
    @DisplayName("Le statut PUBLISHED et published_at restent cohérents")
    void publishedStatusAndTimestampMustBeConsistent() throws SQLException {
        String id = insertOutboxEvent("TEST.OUTBOX.CONSISTENCY");

        assertThatThrownBy(
                        () ->
                                update(
                                        "UPDATE integration.outbox_event SET status = 'PUBLISHED' "
                                                + "WHERE id = ?::uuid",
                                        id))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("requires published_at");

        assertThatThrownBy(
                        () ->
                                update(
                                        "UPDATE integration.outbox_event SET published_at = ? "
                                                + "WHERE id = ?::uuid",
                                        Timestamp.from(Instant.parse("2026-07-18T12:01:00Z")),
                                        id))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("must be in PUBLISHED status");
    }

    @Test
    @DisplayName("La contrainte permanente refuse toute publication incohérente à l'insertion")
    void inconsistentPublicationMetadataCannotBeInserted() {
        assertThatThrownBy(
                        () ->
                                update(
                                        "INSERT INTO integration.outbox_event "
                                                + "(aggregate_type, aggregate_id, event_type, status) "
                                                + "VALUES ('TEST', gen_random_uuid(), "
                                                + "'TEST.OUTBOX.MISSING.DATE', 'PUBLISHED')"))
                .isInstanceOf(SQLException.class);

        assertThatThrownBy(
                        () ->
                                update(
                                        "INSERT INTO integration.outbox_event "
                                                + "(aggregate_type, aggregate_id, event_type, status, published_at) "
                                                + "VALUES ('TEST', gen_random_uuid(), "
                                                + "'TEST.OUTBOX.UNEXPECTED.DATE', 'NEW', now())"))
                .isInstanceOf(SQLException.class);
    }

    private String insertOutboxEvent(String eventType) throws SQLException {
        try (Connection connection = connectTo(jdbcUrl);
                PreparedStatement statement =
                        connection.prepareStatement(
                                "INSERT INTO integration.outbox_event "
                                        + "(aggregate_type, aggregate_id, event_type, payload) "
                                        + "VALUES ('TEST', gen_random_uuid(), ?, "
                                        + "'{\"version\":1}'::jsonb) RETURNING id::text")) {
            statement.setString(1, eventType);
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getString(1);
            }
        }
    }

    private String statusOf(String id) throws SQLException {
        return queryString("SELECT status FROM integration.outbox_event WHERE id = ?::uuid", id);
    }

    private Timestamp publishedAtOf(String id) throws SQLException {
        return timestampOf("published_at", id);
    }

    private Timestamp availableAtOf(String id) throws SQLException {
        return timestampOf("available_at", id);
    }

    private Timestamp timestampOf(String column, String id) throws SQLException {
        try (Connection connection = connectTo(jdbcUrl);
                PreparedStatement statement =
                        connection.prepareStatement(
                                "SELECT "
                                        + column
                                        + " FROM integration.outbox_event WHERE id = ?::uuid")) {
            statement.setObject(1, id);
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getTimestamp(1);
            }
        }
    }

    private int countById(String id) throws SQLException {
        try (Connection connection = connectTo(jdbcUrl);
                PreparedStatement statement =
                        connection.prepareStatement(
                                "SELECT count(*) FROM integration.outbox_event WHERE id = ?::uuid")) {
            statement.setObject(1, id);
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
                for (int i = 0; i < parameters.length; i++) {
                    statement.setObject(i + 1, parameters[i]);
                }
                statement.execute();
            }
        }
    }

    private static String queryString(String sql, Object... parameters) throws SQLException {
        try (Connection connection = connectTo(jdbcUrl);
                PreparedStatement statement = connection.prepareStatement(sql)) {
            for (int i = 0; i < parameters.length; i++) {
                statement.setObject(i + 1, parameters[i]);
            }
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getString(1);
            }
        }
    }
}
