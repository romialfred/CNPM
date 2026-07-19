import 'package:cnpm_mobile/features/payments/domain/member_payment.dart';
import 'package:cnpm_mobile/features/payments/domain/member_payment_gateway.dart';

final class LoadMemberPayments {
  const LoadMemberPayments(this._gateway);

  final MemberPaymentGateway _gateway;

  Future<List<MemberPayment>> call() => _gateway.loadPaymentHistory();
}
