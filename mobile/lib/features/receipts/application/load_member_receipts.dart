import 'package:cnpm_mobile/features/receipts/domain/member_receipt.dart';
import 'package:cnpm_mobile/features/receipts/domain/member_receipt_gateway.dart';

final class LoadMemberReceipts {
  const LoadMemberReceipts(this._gateway);

  final MemberReceiptGateway _gateway;

  Future<MemberReceiptCollection> call() => _gateway.loadReceipts();
}
