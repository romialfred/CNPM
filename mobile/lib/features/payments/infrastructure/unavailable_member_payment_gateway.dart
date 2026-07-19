import 'package:cnpm_mobile/core/domain/member_content_failure.dart';
import 'package:cnpm_mobile/features/payments/domain/member_payment.dart';
import 'package:cnpm_mobile/features/payments/domain/member_payment_gateway.dart';

final class UnavailableMemberPaymentGateway implements MemberPaymentGateway {
  const UnavailableMemberPaymentGateway();

  @override
  Future<List<MemberPayment>> loadPaymentHistory() {
    throw const MemberContentFailure(MemberContentFailureKind.unavailable);
  }
}
