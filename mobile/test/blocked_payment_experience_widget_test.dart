import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'helpers/test_app.dart';

void main() {
  testWidgets(
    'MOB-006 reste une préparation sans transaction ni donnée sensible',
    (tester) async {
      await pumpCnpmApp(tester);
      await completeDemoSignIn(tester);
      _go(tester, '/payments/new');
      await tester.pumpAndSettle();

    expect(find.text('Préparer un paiement'), findsOneWidget);
    expect(find.text('350 000 FCFA'), findsOneWidget);
    expect(find.textContaining('aucun numéro Mobile Money'), findsOneWidget);
    expect(find.byType(TextField), findsNothing);
    expect(find.byType(TextFormField), findsNothing);
    await tester.scrollUntilVisible(
        find.byKey(const Key('blocked-payment-submit')),
        240,
        scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Paiement indisponible'), findsOneWidget);

      final disabledButton = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Paiement indisponible'),
      );
      expect(disabledButton.onPressed, isNull);
    },
  );

  testWidgets(
    'MOB-007 ne présente jamais la simulation comme une confirmation',
    (tester) async {
      await pumpCnpmApp(tester);
      await completeDemoSignIn(tester);
      _go(tester, '/payments/DEMO-PAY-006');
      await tester.pumpAndSettle();

      expect(find.text('Suivi de démonstration'), findsOneWidget);
      expect(find.text('Non transmis'), findsOneWidget);
      expect(find.text('Confirmation CNPM'), findsOneWidget);
      expect(
        find.textContaining('Impossible sans transaction'),
        findsOneWidget,
      );
      expect(find.text('Paiement confirmé'), findsNothing);
      expect(find.text('Reçu officiel'), findsNothing);
    },
  );

  testWidgets(
    'MOB-007 ferme une référence inconnue sans fuite de paramètre',
    (tester) async {
      await pumpCnpmApp(tester);
      await completeDemoSignIn(tester);
      _go(tester, '/payments/reference-inconnue-tres-longue');
      await tester.pumpAndSettle();

      expect(find.text('Paiement introuvable'), findsOneWidget);
      expect(find.textContaining('reference-inconnue'), findsNothing);
    },
  );

  testWidgets('les routes MOB-006/007 exigent une session', (tester) async {
    await pumpCnpmApp(tester);
    _go(tester, '/payments/new');
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('email-input')), findsOneWidget);

    _go(tester, '/payments/DEMO-PAY-006');
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('email-input')), findsOneWidget);
  });

  for (final size in const [Size(360, 800), Size(390, 844), Size(430, 932)]) {
    testWidgets('MOB-006/007 reflow ${size.width.toInt()}', (tester) async {
      await pumpCnpmApp(tester, size: size);
      await completeDemoSignIn(tester);

      _go(tester, '/payments/new');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);

      _go(tester, '/payments/DEMO-PAY-006');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('MOB-006/007 supportent un facteur de texte de 200 pour cent', (
    tester,
  ) async {
    await pumpCnpmApp(tester, size: const Size(360, 800), textScaleFactor: 2);
    await completeDemoSignIn(tester);

    _go(tester, '/payments/new');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    _go(tester, '/payments/DEMO-PAY-006');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}

void _go(WidgetTester tester, String path) {
  final context = tester.element(find.byType(Scaffold));
  GoRouter.of(context).go(path);
}
