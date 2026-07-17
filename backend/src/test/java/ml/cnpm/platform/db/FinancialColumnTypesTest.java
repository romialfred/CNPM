package ml.cnpm.platform.db;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Verrouille les règles de typage de {@code CLAUDE.md} sur le schéma réel.
 *
 * <p>Ces règles — jamais de flottant pour un montant, {@code timestamptz} pour les
 * horodatages, clé primaire technique UUID — sont aujourd'hui respectées. Sans
 * test, une migration ultérieure pourrait les rompre silencieusement : un montant
 * en {@code double} ne se voit qu'au moment où les centimes ont déjà dérivé.
 */
class FinancialColumnTypesTest extends PostgresMigrationSupport {

    /**
     * Seules colonnes {@code numeric} qui ne sont pas des montants. Toute autre
     * colonne numeric doit être en {@code numeric(19,2)}.
     *
     * <p>Un filtre par nom de montant ({@code %amount%}…) laissait passer de vraies
     * colonnes monétaires comme {@code incentive.revenue_share_statement.gross_collected}.
     * L'invariant est donc inversé : une nouvelle colonne monétaire est contrôlée
     * par défaut, et une exception doit être déclarée ici explicitement.
     */
    private static final String NON_MONETARY_NUMERIC_COLUMNS = "'score', 'match_score', 'risk_score', 'rate'";

    private static String jdbcUrl;

    @BeforeAll
    static void migrate() throws SQLException {
        jdbcUrl = migratedDatabase();
    }

    @Test
    @DisplayName("Aucune colonne n'utilise un type à virgule flottante")
    void noFloatingPointColumnExists() throws SQLException {
        List<String> offenders =
                queryColumns(
                        "SELECT table_schema || '.' || table_name || '.' || column_name "
                                + "FROM information_schema.columns "
                                + "WHERE table_schema IN (" + SCHEMA_FILTER + ") "
                                + "AND data_type IN ('real', 'double precision')");

        assertThat(offenders).isEmpty();
    }

    @Test
    @DisplayName("Toute colonne numeric non listée comme non monétaire est en numeric(19,2)")
    void monetaryColumnsUseExactNumeric() throws SQLException {
        List<String> offenders =
                queryColumns(
                        "SELECT table_schema || '.' || table_name || '.' || column_name "
                                + "|| ' -> numeric(' || numeric_precision || ',' || numeric_scale || ')' "
                                + "FROM information_schema.columns "
                                + "WHERE table_schema IN (" + SCHEMA_FILTER + ") "
                                + "AND data_type = 'numeric' "
                                + "AND column_name NOT IN (" + NON_MONETARY_NUMERIC_COLUMNS + ") "
                                + "AND NOT (numeric_precision = 19 AND numeric_scale = 2)");

        assertThat(offenders).isEmpty();
    }

    @Test
    @DisplayName("Les colonnes monétaires connues sont bien couvertes par l'invariant")
    void knownMonetaryColumnsAreExactNumeric() throws SQLException {
        // Garde-fou contre un invariant qui deviendrait vide ou inopérant : si ces
        // colonnes disparaissaient du filtre, le test précédent passerait à tort.
        List<String> monetary =
                queryColumns(
                        "SELECT table_schema || '.' || table_name || '.' || column_name "
                                + "FROM information_schema.columns "
                                + "WHERE table_schema IN (" + SCHEMA_FILTER + ") "
                                + "AND data_type = 'numeric' "
                                + "AND column_name NOT IN (" + NON_MONETARY_NUMERIC_COLUMNS + ")");

        assertThat(monetary)
                .contains(
                        "payment.payment_transaction.amount",
                        "contribution.contribution_call.amount_due",
                        // Ne contient pas « amount » : un filtre par nom la manquait.
                        "incentive.revenue_share_statement.gross_collected");
    }

    @Test
    @DisplayName("Les horodatages portent un fuseau horaire")
    void timestampColumnsAreTimezoneAware() throws SQLException {
        List<String> offenders =
                queryColumns(
                        "SELECT table_schema || '.' || table_name || '.' || column_name "
                                + "FROM information_schema.columns "
                                + "WHERE table_schema IN (" + SCHEMA_FILTER + ") "
                                + "AND data_type = 'timestamp without time zone'");

        assertThat(offenders).isEmpty();
    }

    @Test
    @DisplayName("Chaque table porte une clé primaire technique UUID")
    void everyTableHasUuidPrimaryKey() throws SQLException {
        // Vérifier le type d'une colonne nommée « id » ne prouve rien : une table
        // sans contrainte PRIMARY KEY produirait zéro ligne et passerait à tort.
        // On part donc des tables, pas des colonnes.
        List<String> offenders =
                queryColumns(
                        "SELECT t.table_schema || '.' || t.table_name "
                                + "FROM information_schema.tables t "
                                + "WHERE t.table_schema IN (" + SCHEMA_FILTER + ") "
                                + "AND t.table_type = 'BASE TABLE' "
                                + "AND NOT EXISTS ("
                                + "  SELECT 1 FROM information_schema.table_constraints tc "
                                + "  JOIN information_schema.key_column_usage k "
                                + "    ON k.constraint_name = tc.constraint_name "
                                + "   AND k.table_schema = tc.table_schema "
                                + "  JOIN information_schema.columns c "
                                + "    ON c.table_schema = k.table_schema "
                                + "   AND c.table_name = k.table_name "
                                + "   AND c.column_name = k.column_name "
                                + "  WHERE tc.constraint_type = 'PRIMARY KEY' "
                                + "    AND tc.table_schema = t.table_schema "
                                + "    AND tc.table_name = t.table_name "
                                + "    AND c.data_type = 'uuid')");

        assertThat(offenders).isEmpty();
    }

    private static List<String> queryColumns(String sql) throws SQLException {
        List<String> rows = new ArrayList<>();
        try (Connection connection = connectTo(jdbcUrl);
                Statement statement = connection.createStatement();
                ResultSet resultSet = statement.executeQuery(sql)) {
            while (resultSet.next()) {
                rows.add(resultSet.getString(1));
            }
        }
        return rows;
    }
}
