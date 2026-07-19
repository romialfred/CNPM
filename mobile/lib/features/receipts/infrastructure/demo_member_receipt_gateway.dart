import 'package:cnpm_mobile/features/receipts/domain/member_receipt.dart';
import 'package:cnpm_mobile/features/receipts/domain/member_receipt_gateway.dart';

final class DemoMemberReceiptGateway implements MemberReceiptGateway {
  const DemoMemberReceiptGateway();

  static const _sourceDisclosure =
      'Source : scénario fictif local. Aucune donnée ne provient du CNPM ni d’un partenaire de paiement.';
  static const _paymentDisclosure =
      'Le paiement associé est uniquement illustratif : aucune transaction, aucun rapprochement et aucune confirmation CNPM ne sont reproduits.';
  static const _proofDisclosure =
      'Aucun PDF, QR, cachet ou signature n’est généré. Le téléchargement et le partage restent indisponibles tant que DEC-005 et le contrat documentaire ne sont pas finalisés.';

  static final List<MemberReceipt> _receipts = [
    MemberReceipt(
      id: 'demo-receipt-preview-2026-001',
      reference: 'DEMO-APERCU-2026-001',
      periodLabel: 'Période fictive 2026',
      amountXof: 150000,
      scenarioDate: DateTime.utc(2026, 6, 18),
      status: MemberReceiptStatus.demonstrationAvailable,
      sourceDisclosure: _sourceDisclosure,
      paymentDisclosure: _paymentDisclosure,
      proofDisclosure: _proofDisclosure,
    ),
    MemberReceipt(
      id: 'demo-receipt-preview-2025-002',
      reference: 'DEMO-APERCU-2025-002',
      periodLabel: 'Période fictive 2025',
      amountXof: 180000,
      scenarioDate: DateTime.utc(2025, 12, 20),
      status: MemberReceiptStatus.demonstrationCancelled,
      sourceDisclosure: _sourceDisclosure,
      paymentDisclosure: _paymentDisclosure,
      proofDisclosure: _proofDisclosure,
    ),
  ];

  @override
  Future<MemberReceiptCollection> loadReceipts() async {
    return MemberReceiptsAvailable(List.unmodifiable(_receipts));
  }

  @override
  Future<MemberReceiptLookup> findReceipt(String id) async {
    final normalizedId = id.trim().toLowerCase();
    for (final receipt in _receipts) {
      if (receipt.id == normalizedId) {
        return MemberReceiptFound(receipt);
      }
    }
    return const MemberReceiptNotFound();
  }
}
