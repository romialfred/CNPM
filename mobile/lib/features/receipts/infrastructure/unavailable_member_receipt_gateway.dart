import 'package:cnpm_mobile/features/receipts/domain/member_receipt.dart';
import 'package:cnpm_mobile/features/receipts/domain/member_receipt_gateway.dart';

/// `/portal/documents` et `/receipts/{id}` retournent encore le schéma générique
/// `Resource`. Le profil HTTP reste fermé : aucun mapping de reçu n'est inventé.
final class UnavailableMemberReceiptGateway implements MemberReceiptGateway {
  const UnavailableMemberReceiptGateway();

  static const reason =
      'La source sécurisée des reçus est indisponible : le contrat API ne décrit pas encore une ressource documentaire suffisamment typée.';

  @override
  Future<MemberReceiptLookup> findReceipt(String id) async {
    return const MemberReceiptUnavailable(reason);
  }

  @override
  Future<MemberReceiptCollection> loadReceipts() async {
    return const MemberReceiptsUnavailable(reason);
  }
}
