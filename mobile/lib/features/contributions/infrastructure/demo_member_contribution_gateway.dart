import 'package:cnpm_mobile/features/contributions/domain/member_contribution.dart';
import 'package:cnpm_mobile/features/contributions/domain/member_contribution_gateway.dart';

final class DemoMemberContributionGateway implements MemberContributionGateway {
  const DemoMemberContributionGateway();

  static final List<MemberContribution> _contributions = [
    MemberContribution(
      id: 'demo-contribution-2026-001',
      reference: 'DEMO-COT-2026-001',
      periodLabel: 'Exercice fictif 2026',
      amountCalledXof: 450000,
      amountSettledXof: 150000,
      balanceXof: 300000,
      dueOn: DateTime.utc(2026, 12, 15),
      status: MemberContributionStatus.partiallySettled,
      dueState: ContributionDueState.upcoming,
      installments: [
        ContributionInstallment(
          number: 1,
          dueOn: DateTime.utc(2026, 6, 15),
          amountCalledXof: 150000,
          amountSettledXof: 150000,
          status: ContributionInstallmentStatus.settled,
          dueState: ContributionDueState.settled,
        ),
        ContributionInstallment(
          number: 2,
          dueOn: DateTime.utc(2026, 9, 15),
          amountCalledXof: 150000,
          amountSettledXof: 0,
          status: ContributionInstallmentStatus.pending,
          dueState: ContributionDueState.upcoming,
        ),
        ContributionInstallment(
          number: 3,
          dueOn: DateTime.utc(2026, 12, 15),
          amountCalledXof: 150000,
          amountSettledXof: 0,
          status: ContributionInstallmentStatus.pending,
          dueState: ContributionDueState.upcoming,
        ),
      ],
      calculationDisclosure:
          'Méthode de calcul non présentée : le barème CNPM dépend de DEC-008, encore ouverte.',
      adjustmentDisclosure:
          'Aucun ajustement dans ce scénario entièrement fictif.',
      documentDisclosure:
          'Appel téléchargeable indisponible : le contrat portail ne décrit pas encore le document.',
    ),
    MemberContribution(
      id: 'demo-contribution-2025-001',
      reference: 'DEMO-COT-2025-001',
      periodLabel: 'Exercice fictif 2025',
      amountCalledXof: 360000,
      amountSettledXof: 360000,
      balanceXof: 0,
      dueOn: DateTime.utc(2025, 12, 15),
      status: MemberContributionStatus.settled,
      dueState: ContributionDueState.settled,
      installments: [
        ContributionInstallment(
          number: 1,
          dueOn: DateTime.utc(2025, 6, 15),
          amountCalledXof: 180000,
          amountSettledXof: 180000,
          status: ContributionInstallmentStatus.settled,
          dueState: ContributionDueState.settled,
        ),
        ContributionInstallment(
          number: 2,
          dueOn: DateTime.utc(2025, 12, 15),
          amountCalledXof: 180000,
          amountSettledXof: 180000,
          status: ContributionInstallmentStatus.settled,
          dueState: ContributionDueState.settled,
        ),
      ],
      calculationDisclosure:
          'Méthode de calcul non présentée : le barème CNPM dépend de DEC-008, encore ouverte.',
      adjustmentDisclosure:
          'Aucun ajustement dans ce scénario entièrement fictif.',
      documentDisclosure:
          'Appel téléchargeable indisponible : le contrat portail ne décrit pas encore le document.',
    ),
    MemberContribution(
      id: 'demo-contribution-2024-001',
      reference: 'DEMO-COT-2024-001',
      periodLabel: 'Exercice fictif 2024',
      amountCalledXof: 240000,
      amountSettledXof: 0,
      balanceXof: 240000,
      dueOn: DateTime.utc(2024, 12, 15),
      status: MemberContributionStatus.issued,
      dueState: ContributionDueState.overdue,
      installments: [
        ContributionInstallment(
          number: 1,
          dueOn: DateTime.utc(2024, 12, 15),
          amountCalledXof: 240000,
          amountSettledXof: 0,
          status: ContributionInstallmentStatus.pending,
          dueState: ContributionDueState.overdue,
        ),
      ],
      calculationDisclosure:
          'Méthode de calcul non présentée : le barème CNPM dépend de DEC-008, encore ouverte.',
      adjustmentDisclosure:
          'Aucun ajustement dans ce scénario entièrement fictif.',
      documentDisclosure:
          'Appel téléchargeable indisponible : le contrat portail ne décrit pas encore le document.',
    ),
  ];

  @override
  Future<List<MemberContribution>> loadContributions() async =>
      List.unmodifiable(_contributions);

  @override
  Future<MemberContributionLookup> findContribution(String id) async {
    final normalizedId = id.trim().toLowerCase();
    for (final contribution in _contributions) {
      if (contribution.id == normalizedId) {
        return MemberContributionFound(contribution);
      }
    }
    return const MemberContributionNotFound();
  }
}
