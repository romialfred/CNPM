import 'package:cnpm_mobile/features/payments/domain/member_payment.dart';
import 'package:cnpm_mobile/features/payments/domain/member_payment_gateway.dart';

final class DemoMemberPaymentGateway implements MemberPaymentGateway {
  const DemoMemberPaymentGateway();

  @override
  Future<List<MemberPayment>> loadPaymentHistory() async {
    return [
      MemberPayment(
        reference: 'DEMO-PAY-0002',
        amountXof: 250000,
        submittedOn: DateTime.utc(2026, 7, 15),
        channelLabel: 'Virement déclaré',
        status: MemberPaymentStatus.processing,
      ),
      MemberPayment(
        reference: 'DEMO-PAY-0001',
        amountXof: 150000,
        submittedOn: DateTime.utc(2026, 7, 4),
        channelLabel: 'Dépôt déclaré',
        status: MemberPaymentStatus.needsReview,
      ),
    ];
  }
}
