package ml.cnpm.platform.db;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Vérifie que les migrations s'appliquent depuis une base vide et depuis la
 * version précédente, comme l'exige {@code .claude/rules/testing.md}.
 */
class FlywayMigrationTest extends PostgresMigrationSupport {

    @Test
    @DisplayName("Les migrations s'appliquent intégralement depuis une base vide")
    void migratesFromEmptyDatabase() throws SQLException {
        String jdbcUrl = freshDatabaseUrl();

        var result = flywayFor(jdbcUrl, null).migrate();

        assertThat(result.success).isTrue();
        assertThat(result.migrationsExecuted).isEqualTo(allVersions().size());
        assertThat(countSchemas(jdbcUrl)).isEqualTo(17);
        assertThat(countTables(jdbcUrl)).isEqualTo(73);
    }

    @Test
    @DisplayName("Les migrations s'appliquent depuis la version précédente sans rejouer l'historique")
    void migratesFromPreviousVersion() throws SQLException {
        // La version précédente est dérivée du dépôt, jamais codée en dur : figée,
        // l'assertion continuerait à valider un incrément obsolète après l'ajout
        // d'une migration, au lieu du dernier incrément réellement livré.
        List<String> versions = allVersions();
        String previous = versions.get(versions.size() - 2);
        String jdbcUrl = freshDatabaseUrl();

        var initial = flywayFor(jdbcUrl, previous).migrate();
        assertThat(initial.migrationsExecuted).isEqualTo(versions.size() - 1);

        var upgrade = flywayFor(jdbcUrl, null).migrate();

        assertThat(upgrade.success).isTrue();
        assertThat(upgrade.migrationsExecuted).isEqualTo(1);
    }

    @Test
    @DisplayName("Les protections append-only n'existent qu'une fois V4 appliquée")
    void appendOnlyProtectionAppearsWithItsMigration() throws SQLException {
        String jdbcUrl = freshDatabaseUrl();

        flywayFor(jdbcUrl, "3").migrate();
        assertThat(appendOnlyGuardedTables(jdbcUrl)).isEmpty();

        flywayFor(jdbcUrl, "4").migrate();
        assertThat(appendOnlyGuardedTables(jdbcUrl))
                .containsExactlyInAnyOrderElementsOf(APPEND_ONLY_TABLES);
    }

    @Test
    @DisplayName("Les protections TRUNCATE n'existent qu'une fois V5 appliquée")
    void truncateProtectionAppearsWithItsMigration() throws SQLException {
        String jdbcUrl = freshDatabaseUrl();

        flywayFor(jdbcUrl, "4").migrate();
        assertThat(truncateGuardedTables(jdbcUrl)).isEmpty();

        flywayFor(jdbcUrl, "5").migrate();
        assertThat(truncateGuardedTables(jdbcUrl))
                .containsExactlyInAnyOrderElementsOf(APPEND_ONLY_TABLES);
    }

    @Test
    @DisplayName("Rejouer les migrations sur une base à jour n'applique aucun changement")
    void replayingMigrationsAppliesNothing() throws SQLException {
        String jdbcUrl = migratedDatabase();

        var replay = flywayFor(jdbcUrl, null).migrate();

        assertThat(replay.migrationsExecuted).isZero();
    }

    @Test
    @DisplayName("Aucune migration déjà appliquée n'a été modifiée après coup")
    void appliedMigrationsAreUnchanged() throws SQLException {
        String jdbcUrl = migratedDatabase();

        // Une migration publiée est immuable : elle se corrige par une nouvelle
        // version. validate() compare les empreintes enregistrées aux fichiers.
        flywayFor(jdbcUrl, null).validate();
    }

    /** Versions présentes dans le dépôt, dans l'ordre d'application. */
    private List<String> allVersions() throws SQLException {
        String jdbcUrl = freshDatabaseUrl();
        List<String> versions = new ArrayList<>();
        for (MigrationInfo info : flywayFor(jdbcUrl, null).info().all()) {
            versions.add(info.getVersion().getVersion());
        }
        return versions;
    }

    private List<String> appendOnlyGuardedTables(String jdbcUrl) throws SQLException {
        return guardedTables(jdbcUrl, "trg_append_only_%", "reject_update_delete");
    }

    private List<String> truncateGuardedTables(String jdbcUrl) throws SQLException {
        return guardedTables(jdbcUrl, "trg_truncate_guard_%", "reject_truncate");
    }

    /**
     * Tables réellement porteuses d'un trigger de garde actif, par nom qualifié.
     *
     * <p>La fonction exécutée est vérifiée, pas seulement le nom du trigger : un
     * trigger bien nommé qui n'appellerait pas la fonction de rejet ne protégerait
     * rien tout en satisfaisant un contrôle purement nominal.
     */
    private List<String> guardedTables(String jdbcUrl, String namePattern, String functionName)
            throws SQLException {
        List<String> tables = new ArrayList<>();
        String sql =
                "SELECT n.nspname || '.' || c.relname "
                        + "FROM pg_trigger t "
                        + "JOIN pg_class c ON c.oid = t.tgrelid "
                        + "JOIN pg_namespace n ON n.oid = c.relnamespace "
                        + "JOIN pg_proc p ON p.oid = t.tgfoid "
                        + "WHERE NOT t.tgisinternal AND t.tgenabled <> 'D' "
                        + "AND t.tgname LIKE '" + namePattern + "' "
                        + "AND p.proname = '" + functionName + "'";
        try (Connection connection = connectTo(jdbcUrl);
                Statement statement = connection.createStatement();
                ResultSet resultSet = statement.executeQuery(sql)) {
            while (resultSet.next()) {
                tables.add(resultSet.getString(1));
            }
        }
        return tables;
    }

    private int countSchemas(String jdbcUrl) throws SQLException {
        return count(
                jdbcUrl,
                "SELECT count(*) FROM information_schema.schemata WHERE schema_name IN ("
                        + SCHEMA_FILTER + ")");
    }

    private int countTables(String jdbcUrl) throws SQLException {
        return count(
                jdbcUrl,
                "SELECT count(*) FROM information_schema.tables WHERE table_type = 'BASE TABLE' "
                        + "AND table_schema IN (" + SCHEMA_FILTER + ")");
    }

    private int count(String jdbcUrl, String sql) throws SQLException {
        try (Connection connection = connectTo(jdbcUrl);
                Statement statement = connection.createStatement();
                ResultSet resultSet = statement.executeQuery(sql)) {
            resultSet.next();
            return resultSet.getInt(1);
        }
    }
}
