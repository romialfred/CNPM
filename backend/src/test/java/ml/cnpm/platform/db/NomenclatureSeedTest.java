package ml.cnpm.platform.db;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Vérifie que la migration V6 sème la nomenclature institutionnelle réelle du CNPM
 * (7 Conseils Patronaux de Région et 39 groupements professionnels) et qu'elle est
 * idempotente, comme l'exige {@code .claude/rules/testing.md} pour toute donnée de
 * référence rejouable.
 */
class NomenclatureSeedTest extends PostgresMigrationSupport {

    @Test
    @DisplayName("V6 sème les 7 régions CPR dans ref.reference_value")
    void seedsSevenRegions() throws SQLException {
        String jdbcUrl = migratedDatabase();

        List<String> codes =
                queryStrings(
                        jdbcUrl,
                        "SELECT code FROM ref.reference_value"
                                + " WHERE domain = 'REGION' ORDER BY sort_order");

        assertThat(codes)
                .containsExactly(
                        "KAYES", "KOULIKORO", "SIKASSO", "SEGOU", "MOPTI", "GAO", "TOMBOUCTOU");
    }

    @Test
    @DisplayName("V6 sème les 39 groupements professionnels avec des libellés non vides")
    void seedsThirtyNineProfessionalGroups() throws SQLException {
        String jdbcUrl = migratedDatabase();

        assertThat(countRows(jdbcUrl, "SELECT count(*) FROM member.professional_group"))
                .isEqualTo(39);
        // Aucun libellé vide : la contrainte NOT NULL ne l'empêcherait pas.
        assertThat(
                        countRows(
                                jdbcUrl,
                                "SELECT count(*) FROM member.professional_group"
                                        + " WHERE name IS NULL OR btrim(name) = ''"))
                .isZero();
        // Quelques sigles réels attendus, sur des branches distinctes.
        assertThat(
                        queryStrings(
                                jdbcUrl,
                                "SELECT code FROM member.professional_group"
                                        + " WHERE code IN ('APBEF', 'CNOM', 'FNTRM', 'SPBM')"
                                        + " ORDER BY code"))
                .containsExactly("APBEF", "CNOM", "FNTRM", "SPBM");
    }

    @Test
    @DisplayName("Le seed est idempotent : réappliquer les inserts ne crée pas de doublon")
    void seedIsIdempotent() throws SQLException {
        String jdbcUrl = migratedDatabase();

        // Réinsertion avec un libellé DIFFÉRENT sur les deux tables : DO NOTHING doit
        // préserver l'existant, jamais l'écraser.
        try (Connection connection = connectTo(jdbcUrl);
                Statement statement = connection.createStatement()) {
            statement.execute(
                    "INSERT INTO ref.reference_value (domain, code, label, sort_order, active)"
                            + " VALUES ('REGION', 'KAYES', 'Libellé écrasant', 99, false)"
                            + " ON CONFLICT (domain, code) DO NOTHING");
            statement.execute(
                    "INSERT INTO member.professional_group (code, name)"
                            + " VALUES ('APBEF', 'Libellé écrasant') ON CONFLICT (code) DO NOTHING");
        }

        assertThat(
                        countRows(
                                jdbcUrl,
                                "SELECT count(*) FROM ref.reference_value WHERE domain = 'REGION'"))
                .isEqualTo(7);
        assertThat(countRows(jdbcUrl, "SELECT count(*) FROM member.professional_group"))
                .isEqualTo(39);
        // Les lignes existantes ne sont pas écrasées par le réinsert.
        assertThat(
                        queryStrings(
                                jdbcUrl,
                                "SELECT label FROM ref.reference_value"
                                        + " WHERE domain = 'REGION' AND code = 'KAYES'"))
                .containsExactly("Kayes");
        assertThat(
                        queryStrings(
                                jdbcUrl,
                                "SELECT name FROM member.professional_group WHERE code = 'APBEF'"))
                .containsExactly(
                        "Association Professionnelle des Banques et Etablissements Financiers du Mali");
    }

    @Test
    @DisplayName("Le seed s'applique aussi lorsque V6 est appliquée après V5 (version précédente)")
    void seedAppliesWhenUpgradingFromPreviousVersion() throws SQLException {
        String jdbcUrl = freshDatabaseUrl();

        // La nomenclature n'existe pas avant V6.
        flywayFor(jdbcUrl, "5").migrate();
        assertThat(
                        countRows(
                                jdbcUrl,
                                "SELECT count(*) FROM ref.reference_value WHERE domain = 'REGION'"))
                .isZero();
        assertThat(countRows(jdbcUrl, "SELECT count(*) FROM member.professional_group"))
                .isZero();

        // L'application de V6 seule la sème.
        flywayFor(jdbcUrl, null).migrate();
        assertThat(
                        countRows(
                                jdbcUrl,
                                "SELECT count(*) FROM ref.reference_value WHERE domain = 'REGION'"))
                .isEqualTo(7);
        assertThat(countRows(jdbcUrl, "SELECT count(*) FROM member.professional_group"))
                .isEqualTo(39);
    }

    private static long countRows(String jdbcUrl, String sql) throws SQLException {
        try (Connection connection = connectTo(jdbcUrl);
                Statement statement = connection.createStatement();
                ResultSet rs = statement.executeQuery(sql)) {
            rs.next();
            return rs.getLong(1);
        }
    }

    private static List<String> queryStrings(String jdbcUrl, String sql) throws SQLException {
        List<String> values = new ArrayList<>();
        try (Connection connection = connectTo(jdbcUrl);
                Statement statement = connection.createStatement();
                ResultSet rs = statement.executeQuery(sql)) {
            while (rs.next()) {
                values.add(rs.getString(1));
            }
        }
        return values;
    }
}
