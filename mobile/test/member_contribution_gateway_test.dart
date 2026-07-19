import 'package:flutter_test/flutter_test.dart';

import 'package:cnpm_mobile/core/domain/member_content_failure.dart';
import 'package:cnpm_mobile/features/contributions/domain/member_contribution.dart';
import 'package:cnpm_mobile/features/contributions/infrastructure/demo_member_contribution_gateway.dart';
import 'package:cnpm_mobile/features/contributions/infrastructure/unavailable_member_contribution_gateway.dart';

void main() {
  test(
    'MOB-004 transporte uniquement des cotisations fictives cohérentes',
    () async {
      final contributions = await const DemoMemberContributionGateway()
          .loadContributions();

      expect(contributions, isNotEmpty);
      for (final contribution in contributions) {
        expect(contribution.id, startsWith('demo-contribution-'));
        expect(contribution.reference, startsWith('DEMO-COT-'));
        expect(
          contribution.amountCalledXof,
          contribution.amountSettledXof + contribution.balanceXof,
        );
        expect(contribution.calculationDisclosure, contains('DEC-008'));
        expect(contribution.documentDisclosure, contains('indisponible'));
        expect(
          contribution.installments.fold<int>(
            0,
            (sum, installment) => sum + installment.amountCalledXof,
          ),
          contribution.amountCalledXof,
        );
      }
    },
  );

  test('MOB-005 distingue un détail trouvé d’une référence inconnue', () async {
    const gateway = DemoMemberContributionGateway();

    final found = await gateway.findContribution('demo-contribution-2026-001');
    final missing = await gateway.findContribution('inconnue');

    expect(found, isA<MemberContributionFound>());
    expect(missing, isA<MemberContributionNotFound>());
  });

  test('le profil HTTP reste fermé tant que Resource n’est pas typé', () async {
    const gateway = UnavailableMemberContributionGateway();

    await expectLater(
      gateway.loadContributions(),
      throwsA(isA<MemberContentFailure>()),
    );
    await expectLater(
      gateway.findContribution('demo-contribution-2026-001'),
      throwsA(isA<MemberContentFailure>()),
    );
  });
}
