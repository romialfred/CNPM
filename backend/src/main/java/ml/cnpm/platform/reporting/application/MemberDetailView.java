package ml.cnpm.platform.reporting.application;

import java.util.List;

/**
 * Fiche membre 360° (BO-003), projetée vers le contrat front {@code MemberDetail}.
 *
 * <p>Lecture seule : agrège identité, adhésion, cotisations, paiements et historique depuis
 * le read model {@code reporting.*} et les schémas membre/cotisation/paiement. Aucune écriture
 * financière n'est exposée. Les champs sans source restent {@code null} ou vides — jamais
 * une valeur inventée. Le showcase public R4 (réalisations, galerie, certifications) reste
 * hors périmètre tant que sa checklist de promotion n'est pas close.
 */
public record MemberDetailView(
        Identity identity,
        Profile profile,
        Contact mainContact,
        Summary summary,
        List<ContributionLine> contributions,
        List<PaymentLine> payments,
        List<Document> documents,
        List<History> history,
        List<Alert> alerts,
        List<NextAction> nextActions,
        Risk risk,
        Agent agent,
        Permissions permissions) {

    public record Identity(
            String id, String code, String organization, String legalForm, String category,
            String sector, String group, String region, String address, String status,
            String verification, String verifiedAt, boolean isLargeContributor) { }

    public record Profile(
            String rccm, String nif, String employeeRange, Integer foundedYear, String joinedOn,
            int seniorityYears, String membershipReference, String phone, String email, String website) { }

    public record Contact(String name, String role, String phone, String email) { }

    public record Summary(
            int year, long expected, long paid, long outstanding, int overduePeriods,
            Integer settledShare, String nextDueLabel, String nextDueOn, int receiptsIssued) { }

    public record ContributionLine(
            String period, String label, String dueOn, long expected, long paid, String status) { }

    public record PaymentLine(
            String reference, String paidAt, String period, long amount, String channel,
            String receipt, String status) { }

    public record Document(
            String id, String title, String kind, String issuedOn, String expiresOn,
            String sizeLabel, String status) { }

    public record History(String id, String at, String actor, String action, String detail) { }

    public record Alert(String id, String tone, String title, String message, String nextAction) { }

    public record NextAction(String id, String label, String priority, String dueOn) { }

    public record Risk(int score, String level, String assessedOn, List<String> factors) { }

    public record Agent(
            String name, String role, String phone, String email, int portfolio,
            int recoveryRate, String lastContactOn) { }

    public record Permissions(boolean canEdit, boolean canViewContacts, boolean canViewFinancials) { }
}
