import 'package:cnpm_mobile/features/payments/domain/member_payment.dart';

abstract interface class MemberPaymentGateway {
  Future<List<MemberPayment>> loadPaymentHistory();
}
