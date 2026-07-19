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
    testWidgets('MOB-001 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile('goldens/mob_001_login_${viewport.key}.png'),
      );
    });

    testWidgets('MOB-002 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await openTwoFactorScreen(tester);

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile('goldens/mob_002_verify_${viewport.key}.png'),
      );
    });
  }
}
