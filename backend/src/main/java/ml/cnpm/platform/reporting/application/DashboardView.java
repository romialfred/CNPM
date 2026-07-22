package ml.cnpm.platform.reporting.application;

import java.math.BigDecimal;
import java.util.List;

/**
 * Instantané du tableau de bord d'administration (BO-001), projeté vers le contrat front
 * {@code DashboardSnapshot}. L'écran n'agrège rien : il reçoit des mesures déjà établies.
 *
 * <p>Les valeurs absentes valent {@code null} (« Donnée indisponible », jamais un zéro
 * implicite). Les sections sans source livrée ({@code months}, {@code payments},
 * {@code alerts}, {@code activities}) restent des listes vides tant que leur module n'expose
 * pas de read model.
 */
public record DashboardView(
        String exercise,
        String generatedAt,
        List<Kpi> kpis,
        List<MonthPoint> months,
        Trend trend,
        List<Segment> segments,
        Long memberBase,
        Contributions contributions,
        List<Payment> payments,
        List<Alert> alerts,
        List<Activity> activities,
        List<ChannelSlice> channels) {

    /** Part d'un canal d'encaissement (Mobile Money, virement, espèces) : nombre et montant. */
    public record ChannelSlice(String channel, long count, long amount) { }

    /** Indicateur clé ; {@code value} nul quand la mesure est indisponible pour l'exercice. */
    public record Kpi(
            String key,
            String label,
            BigDecimal value,
            Integer decimals,
            String suffix,
            String unit,
            String definition,
            String route) { }

    /** Agrégats de cotisation de l'exercice ; chaque mesure est nulle si indisponible. */
    public record Contributions(
            BigDecimal expected,
            BigDecimal collected,
            BigDecimal outstanding,
            BigDecimal recoveryRate) { }

    /** Cohorte de segmentation ; {@code scope} distingue base, hors-base et sous-ensemble. */
    public record Segment(String key, String label, long count, BigDecimal share, String scope) { }

    // Formes livrées au contrat mais sans source R0 : réservées, jamais remplies ici.
    public record MonthPoint(
            String key, String label, String shortLabel,
            BigDecimal expected, BigDecimal collected, BigDecimal rate) { }

    public record Trend(String direction, BigDecimal value, String reference, String current) { }

    public record Payment(
            String id, String reference, String payer, BigDecimal amount,
            String channel, String status, String paidAt) { }

    public record Alert(String id, String severity, String title, String detail, String raisedAt) { }

    public record Activity(String id, String label, String detail, String occurredAt) { }
}
