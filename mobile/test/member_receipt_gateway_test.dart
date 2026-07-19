import 'package:flutter_test/flutter_test.dart';

import 'package:cnpm_mobile/features/receipts/domain/member_receipt.dart';
import 'package:cnpm_mobile/features/receipts/infrastructure/demo_member_receipt_gateway.dart';
import 'package:cnpm_mobile/features/receipts/infrastructure/unavailable_member_receipt_gateway.dart';

void main() {
  test(
    'MOB-009 transporte uniquement des aperçus intrinsèquement fictifs',
    () async {
      final collection = await const DemoMemberReceiptGateway().loadReceipts();

      expect(collection, isA<MemberReceiptsAvailable>());
      final receipts = (collection as MemberReceiptsAvailable).receipts;
      expect(receipts, isNotEmpty);
      for (final receipt in receipts) {
        expect(receipt.id, startsWith('demo-receipt-preview-'));
        expect(receipt.reference, startsWith('DEMO-APERCU-'));
        expect(receipt.sourceDisclosure, contains('scénario fictif local'));
        expect(receipt.paymentDisclosure, contains('aucune confirmation CNPM'));
        expect(
          receipt.proofDisclosure,
          contains('Aucun PDF, QR, cachet ou signature'),
        );
        expect(receipt.proofDisclosure, contains('indisponibles'));
      }
    },
  );

  test('MOB-010 distingue aperçu trouvé et référence inconnue', () async {
    const gateway = DemoMemberReceiptGateway();

    final found = await gateway.findReceipt('demo-receipt-preview-2026-001');
    final missing = await gateway.findReceipt('reference-inconnue');

    expect(found, isA<MemberReceiptFound>());
    expect(missing, isA<MemberReceiptNotFound>());
  });

  test('le profil HTTP reste fermé avec un état indisponible typé', () async {
    const gateway = UnavailableMemberReceiptGateway();

    final collection = await gateway.loadReceipts();
    final detail = await gateway.findReceipt('receipt-id');

    expect(collection, isA<MemberReceiptsUnavailable>());
    expect(detail, isA<MemberReceiptUnavailable>());
    expect(
      (collection as MemberReceiptsUnavailable).reason,
      contains('contrat API'),
    );
  });
}
