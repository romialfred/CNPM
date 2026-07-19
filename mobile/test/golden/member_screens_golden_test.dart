import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/test_app.dart';

void main() {
  const viewports = <String, Size>{
    '360': Size(360, 800),
    '390': Size(390, 844),
    '430': Size(430, 932),
  };

  for (final viewport in viewports.entries) {
    testWidgets('MOB-003 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile('goldens/mob_003_home_${viewport.key}.png'),
      );
    });

    testWidgets('MOB-008 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);
      await tester.tap(find.text('Paiements'));
      await tester.pumpAndSettle();

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile('goldens/mob_008_payments_${viewport.key}.png'),
      );
    });

    testWidgets('MOB-011 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);
      await tester.tap(find.text('Requêtes'));
      await tester.pumpAndSettle();

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile('goldens/mob_011_requests_${viewport.key}.png'),
      );
    });
  }
}
