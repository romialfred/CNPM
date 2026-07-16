import 'package:cnpm_mobile/src/cnpm_app.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('affiche le socle CNPM', (tester) async {
    await tester.pumpWidget(const CnpmApp());
    expect(find.text('Socle mobile initialisé'), findsOneWidget);
  });
}
