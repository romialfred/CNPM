import 'package:cnpm_mobile/features/receipts/domain/member_receipt.dart';
import 'package:cnpm_mobile/features/receipts/domain/member_receipt_gateway.dart';

final class LoadMemberReceipt {
  const LoadMemberReceipt(this._gateway);

  final MemberReceiptGateway _gateway;

  Future<MemberReceiptLookup> call(String id) => _gateway.findReceipt(id);
}
