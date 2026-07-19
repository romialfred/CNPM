import 'package:cnpm_mobile/features/receipts/domain/member_receipt.dart';

abstract interface class MemberReceiptGateway {
  Future<MemberReceiptCollection> loadReceipts();

  Future<MemberReceiptLookup> findReceipt(String id);
}
