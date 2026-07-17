package ml.cnpm.platform.db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.flywaydb.core.Flyway;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Socle des tests de migration PostgreSQL.
 *
 * <p>Un conteneur unique est partagé par les classes de test ; chaque test
 * obtient une base vierge dédiée. Les migrations doivent être vérifiables depuis
 * une base vide comme depuis la version précédente ({@code .claude/rules/testing.md}),
 * ce qui interdit de réutiliser un schéma déjà migré entre deux tests.
 *
 * <p>L'image est alignée sur {@code infrastructure/docker/compose.yaml} et sur la
 * CI : tester une version majeure différente de celle exécutée en production
 * validerait un comportement qui n'est pas celui livré.
 */
abstract class PostgresMigrationSupport {

    /** Schémas du modèle, conformes à docs/03-data/data-model.md. */
    protected static final String SCHEMA_FILTER =
            "'ref','iam','member','enrollment','contribution','payment','receipt','recovery',"
                    + "'incentive','service','document','governance','event','notification',"
                    + "'integration','audit','reporting'";

    /**
     * Tables marquées « Append-only = Oui » dans docs/03-data/data-dictionary.csv.
     *
     * <p>Liste nominale volontaire : compter les triggers ne prouve pas qu'ils sont
     * attachés aux bonnes tables. Un trigger rattaché par erreur à une table voisine
     * garderait le compte juste tout en laissant l'écriture financière modifiable.
     */
    protected static final List<String> APPEND_ONLY_TABLES = List.of(
            "member.membership_status_history",
            "enrollment.enrollment_review",
            "enrollment.enrollment_decision",
            "contribution.adjustment",
            "payment.payment_transaction",
            "payment.payment_allocation",
            "payment.provider_event",
            "payment.bank_statement_line",
            "receipt.receipt",
            "recovery.recovery_action",
            "incentive.bonus_line",
            "service.request_message",
            "document.document_version",
            "notification.delivery_attempt",
            "integration.outbox_event",
            "integration.webhook_delivery",
            "audit.audit_event",
            "audit.security_event",
            "audit.data_export");

    private static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer(DockerImageName.parse("postgres:18.4"));

    private static final AtomicInteger DATABASE_COUNTER = new AtomicInteger();

    static {
        POSTGRES.start();
    }

    /** Crée une base vierge et retourne son URL JDBC. */
    protected static String freshDatabaseUrl() throws SQLException {
        String name = "cnpm_test_" + DATABASE_COUNTER.incrementAndGet();
        try (Connection connection = admin();
                Statement statement = connection.createStatement()) {
            statement.execute("CREATE DATABASE " + name);
        }
        String base = POSTGRES.getJdbcUrl();
        return base.substring(0, base.lastIndexOf('/') + 1) + name;
    }

    protected static Connection admin() throws SQLException {
        return DriverManager.getConnection(
                POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
    }

    protected static Connection connectTo(String jdbcUrl) throws SQLException {
        return DriverManager.getConnection(jdbcUrl, POSTGRES.getUsername(), POSTGRES.getPassword());
    }

    /** Applique les migrations du dépôt, éventuellement jusqu'à une version cible. */
    protected static Flyway flywayFor(String jdbcUrl, String target) {
        var configuration = Flyway.configure()
                .dataSource(jdbcUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration");
        if (target != null) {
            configuration = configuration.target(target);
        }
        return configuration.load();
    }

    /** Base vierge entièrement migrée, prête pour les tests de comportement. */
    protected static String migratedDatabase() throws SQLException {
        String jdbcUrl = freshDatabaseUrl();
        flywayFor(jdbcUrl, null).migrate();
        return jdbcUrl;
    }
}
