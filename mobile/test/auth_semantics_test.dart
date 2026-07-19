import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers/test_app.dart';

void main() {
  testWidgets('MOB-001 expose labels, actions et cibles tactiles', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await pumpCnpmApp(tester, size: const Size(360, 800));

    expect(
      find.bySemanticsLabel('Conseil National du Patronat du Mali'),
      findsOneWidget,
    );
    expect(
      find.bySemanticsLabel(RegExp('Adresse e-mail de démonstration')),
      findsOneWidget,
    );
    expect(
      find.bySemanticsLabel(RegExp('Mot de passe fictif')),
      findsOneWidget,
    );
    expect(
      tester.getSize(find.byKey(const Key('login-submit'))).height,
      greaterThanOrEqualTo(44),
    );

    semantics.dispose();
  });

  testWidgets('MOB-002 conserve un champ OTP logique unique', (tester) async {
    final semantics = tester.ensureSemantics();
    await pumpCnpmApp(tester, size: const Size(390, 844));
    await openTwoFactorScreen(tester);

    expect(
      find.bySemanticsLabel(RegExp('Code de vérification à six chiffres')),
      findsOneWidget,
    );
    expect(find.byKey(const Key('otp-input')), findsOneWidget);
    expect(
      tester.getSize(find.byKey(const Key('verify-submit'))).height,
      greaterThanOrEqualTo(44),
    );

    semantics.dispose();
  });

  testWidgets('les écrans restent utilisables à 200 pour cent', (tester) async {
    await pumpCnpmApp(tester, size: const Size(360, 800), textScaleFactor: 2);

    await tester.drag(
      find.byType(SingleChildScrollView),
      const Offset(0, -400),
    );
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('login-submit')), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('MOB-003/008/011 exposent des libellés sémantiques utiles', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await pumpCnpmApp(tester, size: const Size(360, 800));
    await completeDemoSignIn(tester);

    expect(
      find.bySemanticsLabel(RegExp('2 paiements de démonstration à suivre')),
      findsOneWidget,
    );
    expect(
      tester.getSize(find.byTooltip('Se déconnecter')).height,
      greaterThanOrEqualTo(44),
    );

    await tester.tap(find.text('Finances'));
    await tester.pumpAndSettle();
    expect(
      find.bySemanticsLabel(RegExp('DEMO-PAY-0002.*montant déclaré')),
      findsOneWidget,
    );

    await tester.tap(find.text('Requêtes'));
    await tester.pumpAndSettle();
    expect(
      find.bySemanticsLabel(RegExp('DEMO-REQ-0003.*statut')),
      findsOneWidget,
    );

    semantics.dispose();
  });
}
