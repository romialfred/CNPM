package ml.cnpm.platform.member.application;

import java.math.BigDecimal;
import java.util.List;

/**
 * Tableau de bord de l'espace membre ({@code GET /portal/dashboard}).
 *
 * <p>Projection de lecture strictement bornée à l'adhésion du compte connecté. Elle n'agrège que
 * des données RÉELLES : identité de l'adhésion, situation de cotisation par exercice, nombre de
 * règlements et de reçus. Les totaux sont établis par la source ; l'écran ne recalcule rien.
 */
public final class MemberDashboardView {

    private MemberDashboardView() {}

    /** Identité de l'adhésion. {@code status} est normalisé pour l'affichage membre. */
    public record Identity(
            String organization,
            String memberCode,
            String category,
            String status,
            String memberSince) {}

    /** Totaux d'un exercice, établis par la source. */
    public record ExerciseSummary(
            int year, BigDecimal called, BigDecimal settled, BigDecimal outstanding) {}

    /** Dernier règlement confirmé, ou {@code null} si aucun. */
    public record LastPayment(BigDecimal amount, String currency, String paidAt) {}

    public record Dashboard(
            Identity identity,
            BigDecimal calledTotal,
            BigDecimal settledTotal,
            BigDecimal outstandingTotal,
            BigDecimal overdueAmount,
            String nextDueDate,
            LastPayment lastPayment,
            int paymentCount,
            int receiptCount,
            List<ExerciseSummary> exercises) {}
}
