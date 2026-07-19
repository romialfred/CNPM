import 'package:flutter_test/flutter_test.dart';

import 'package:cnpm_mobile/features/home/infrastructure/demo_member_dashboard_gateway.dart';
import 'package:cnpm_mobile/features/payments/domain/member_payment.dart';
import 'package:cnpm_mobile/features/payments/infrastructure/demo_member_payment_gateway.dart';
import 'package:cnpm_mobile/features/requests/infrastructure/demo_member_request_gateway.dart';

void main() {
  test(
    'MOB-003 ne transporte que l’identité et les suivis du membre',
    () async {
      final dashboard = await const DemoMemberDashboardGateway()
          .loadDashboard();

      expect(dashboard.organizationName, contains('Démo'));
      expect(dashboard.memberReference, startsWith('CNPM-DEMO-'));
      expect(dashboard.paymentsToReview, greaterThanOrEqualTo(0));
      expect(dashboard.openRequests, greaterThanOrEqualTo(0));
    },
  );

  test('MOB-008 ne simule aucun paiement confirmé', () async {
    final payments = await const DemoMemberPaymentGateway()
        .loadPaymentHistory();

    expect(payments, isNotEmpty);
    expect(
      payments.every((payment) => payment.reference.startsWith('DEMO-')),
      isTrue,
    );
    expect(
      payments.every(
        (payment) =>
            payment.status == MemberPaymentStatus.processing ||
            payment.status == MemberPaymentStatus.needsReview,
      ),
      isTrue,
    );
  });

  test('MOB-011 utilise uniquement des requêtes fictives', () async {
    final requests = await const DemoMemberRequestGateway().loadRequests();

    expect(requests, isNotEmpty);
    expect(
      requests.every((request) => request.reference.startsWith('DEMO-')),
      isTrue,
    );
  });
}
