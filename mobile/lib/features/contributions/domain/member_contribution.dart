enum MemberContributionStatus { issued, partiallySettled, settled }

enum ContributionInstallmentStatus { pending, settled }

enum ContributionDueState { upcoming, overdue, settled }

final class ContributionInstallment {
  const ContributionInstallment({
    required this.number,
    required this.dueOn,
    required this.amountCalledXof,
    required this.amountSettledXof,
    required this.status,
    required this.dueState,
  });

  final int number;
  final DateTime dueOn;
  final int amountCalledXof;
  final int amountSettledXof;
  final ContributionInstallmentStatus status;
  final ContributionDueState dueState;
}

/// Projection en lecture seule de PRT-002 pour MOB-004/MOB-005.
///
/// Les montants sont transportés en francs XOF entiers. Ils sont fournis par la
/// source et ne sont jamais recalculés dans l'application mobile : le barème et
/// ses règles restent soumis à DEC-008.
final class MemberContribution {
  const MemberContribution({
    required this.id,
    required this.reference,
    required this.periodLabel,
    required this.amountCalledXof,
    required this.amountSettledXof,
    required this.balanceXof,
    required this.dueOn,
    required this.status,
    required this.dueState,
    required this.installments,
    required this.calculationDisclosure,
    required this.adjustmentDisclosure,
    required this.documentDisclosure,
  });

  final String id;
  final String reference;
  final String periodLabel;
  final int amountCalledXof;
  final int amountSettledXof;
  final int balanceXof;
  final DateTime dueOn;
  final MemberContributionStatus status;
  final ContributionDueState dueState;
  final List<ContributionInstallment> installments;
  final String calculationDisclosure;
  final String adjustmentDisclosure;
  final String documentDisclosure;
}

sealed class MemberContributionLookup {
  const MemberContributionLookup();
}

final class MemberContributionFound extends MemberContributionLookup {
  const MemberContributionFound(this.contribution);

  final MemberContribution contribution;
}

final class MemberContributionNotFound extends MemberContributionLookup {
  const MemberContributionNotFound();
}
