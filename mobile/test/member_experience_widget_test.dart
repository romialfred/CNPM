import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers/test_app.dart';

void main() {
  testWidgets('MOB-003 affiche un accueil membre sans KPI administratifs', (
    tester,
  ) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);

    expect(find.text('Bonjour'), findsOneWidget);
    expect(find.text('Entreprise Démo Sahel'), findsOneWidget);
    expect(find.text('Actions essentielles'), findsOneWidget);
    expect(find.text('Taux de recouvrement'), findsNothing);
    expect(find.text('Membres actifs'), findsNothing);
    expect(find.text('Cotisation encaissée 2024'), findsNothing);
    expect(find.text('Payer ma cotisation'), findsNothing);

    final quickAction = find.byKey(const Key('home-payments-action'));
    await tester.ensureVisible(quickAction);
    expect(tester.getSize(quickAction).height, greaterThanOrEqualTo(44));
  });

  testWidgets('MOB-008 reste en lecture et ne confirme aucun paiement', (
    tester,
  ) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);

    await tester.tap(find.text('Paiements'));
    await tester.pumpAndSettle();

    expect(find.text('Historique des paiements'), findsOneWidget);
    expect(find.text('DEMO-PAY-0002'), findsOneWidget);
    expect(find.text('En traitement'), findsOneWidget);
    expect(find.text('À vérifier'), findsOneWidget);
    expect(find.text('Confirmé'), findsNothing);
    expect(find.text('Encaissé'), findsNothing);
    expect(find.text('Payer'), findsNothing);
  });

  testWidgets('MOB-011 liste les requêtes sans donnée interne', (tester) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);

    await tester.tap(find.text('Requêtes'));
    await tester.pumpAndSettle();

    expect(find.text('Liste des requêtes'), findsOneWidget);
    expect(find.text('DEMO-REQ-0003'), findsOneWidget);
    expect(find.text('Votre réponse attendue'), findsOneWidget);
    expect(find.textContaining('Note interne :'), findsNothing);
    expect(find.textContaining('SLA cible'), findsNothing);
  });

  testWidgets('Reçus et Profil restent explicitement indisponibles', (
    tester,
  ) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);

    await tester.tap(find.text('Reçus'));
    await tester.pump();
    expect(
      find.text(
        'Cette destination n’est pas encore disponible dans la démonstration.',
      ),
      findsOneWidget,
    );

    await tester.tap(find.text('Profil'));
    await tester.pump();
    expect(
      find.text(
        'Cette destination n’est pas encore disponible dans la démonstration.',
      ),
      findsOneWidget,
    );
  });

  for (final size in const [Size(360, 800), Size(390, 844), Size(430, 932)]) {
    testWidgets('MOB-003/008/011 reflow ${size.width.toInt()}', (tester) async {
      await pumpCnpmApp(tester, size: size);
      await completeDemoSignIn(tester);

      expect(tester.takeException(), isNull);

      await tester.tap(find.text('Paiements'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);

      await tester.tap(find.text('Requêtes'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets(
    'les parcours membre supportent un facteur de texte de 200 pour cent',
    (tester) async {
      await pumpCnpmApp(tester, size: const Size(360, 800), textScaleFactor: 2);
      await completeDemoSignIn(tester);

      expect(tester.takeException(), isNull);

      await tester.tap(find.text('Paiements'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);

      await tester.tap(find.text('Requêtes'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    },
  );
}
