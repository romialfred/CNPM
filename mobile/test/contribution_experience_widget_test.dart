import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/features/contributions/domain/member_contribution.dart';
import 'package:cnpm_mobile/features/contributions/presentation/contribution_list_screen.dart';

import 'helpers/test_app.dart';

void main() {
  testWidgets('MOB-004 ouvre une liste fictive en lecture seule', (
    tester,
  ) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);

    final action = find.byKey(const Key('home-contributions-action'));
    expect(action, findsOneWidget);
    await tester.drag(
      find.byKey(const Key('member-home-list')),
      const Offset(0, -420),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Mes cotisations'));
    await tester.pumpAndSettle();

    expect(find.text('Liste des cotisations'), findsOneWidget);
    expect(find.text('DEMO-COT-2026-001'), findsOneWidget);
    expect(find.text('Partiellement réglée — démonstration'), findsOneWidget);
    expect(find.text('Réglée — démonstration'), findsOneWidget);
    expect(find.text('Finances'), findsOneWidget);
    expect(find.textContaining('taux'), findsNothing);
    expect(find.textContaining('niveau de cotisation'), findsNothing);
    expect(find.text('Payer'), findsNothing);
    expect(find.textContaining('reçu'), findsNothing);
    expect(find.textContaining('signature'), findsNothing);
  });

  testWidgets('MOB-004 expose une seule cible de carte de 44 px minimum', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await pumpCnpmApp(tester, size: const Size(360, 800));
    await completeDemoSignIn(tester);
    _goToContributions(tester);
    await tester.pumpAndSettle();

    const cardKey = Key('contribution-demo-contribution-2026-001');
    final card = find.byKey(cardKey);
    expect(card, findsOneWidget);
    expect(tester.getSize(card).height, greaterThanOrEqualTo(44));
    expect(
      find.bySemanticsLabel(RegExp('DEMO-COT-2026-001.*Ouvrir le détail')),
      findsOneWidget,
    );
    expect(
      find.descendant(of: card, matching: find.byType(TextButton)),
      findsNothing,
    );
    expect(find.text('Finances'), findsOneWidget);
    expect(
      find.bySemanticsLabel(RegExp('Cotisations et paiements')),
      findsOneWidget,
    );

    semantics.dispose();
  });

  testWidgets('MOB-005 détaille sans calcul local, document ou reçu fictif', (
    tester,
  ) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);
    _goToContributions(tester);
    await tester.pumpAndSettle();
    final card = find.byKey(
      const Key('contribution-demo-contribution-2026-001'),
    );
    await tester.ensureVisible(card);
    final cardTopLeft = tester.getTopLeft(card);
    await tester.tapAt(cardTopLeft + const Offset(24, 24));
    await tester.pumpAndSettle();

    expect(find.text('Détail de la cotisation'), findsOneWidget);
    expect(find.text('Situation indiquée'), findsOneWidget);
    expect(find.text('Échéancier fictif'), findsOneWidget);
    expect(find.text('Calcul non simulé'), findsOneWidget);
    expect(find.textContaining('DEC-008'), findsOneWidget);
    expect(find.text('Ajustements'), findsOneWidget);
    expect(find.text('Téléchargement indisponible'), findsOneWidget);
    expect(find.text('Payer'), findsNothing);
    expect(find.textContaining('reçu officiel'), findsNothing);
    expect(find.textContaining('signature'), findsNothing);
  });

  testWidgets('le deep link inconnu rend l’état not-found', (tester) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);

    final context = tester.element(find.byKey(const Key('member-home-list')));
    GoRouter.of(context).go('/contributions/reference-inconnue');
    await tester.pumpAndSettle();

    expect(find.text('Cotisation introuvable'), findsOneWidget);
    expect(find.text('Retour aux cotisations'), findsOneWidget);
  });

  testWidgets('MOB-004 couvre chargement, vide et erreur récupérable', (
    tester,
  ) async {
    final completer = Completer<List<MemberContribution>>();
    final loadingController = ContentController<List<MemberContribution>>(
      load: () => completer.future,
      isEmpty: (items) => items.isEmpty,
    );
    addTearDown(loadingController.dispose);
    await _pumpListScreen(tester, loadingController);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    final emptyController = ContentController<List<MemberContribution>>(
      load: () async => [],
      isEmpty: (items) => items.isEmpty,
    );
    addTearDown(emptyController.dispose);
    await _pumpListScreen(tester, emptyController);
    await tester.pumpAndSettle();
    expect(find.text('Aucune cotisation'), findsOneWidget);

    final errorController = ContentController<List<MemberContribution>>(
      load: () => Future.error(StateError('indisponible')),
      isEmpty: (items) => items.isEmpty,
    );
    addTearDown(errorController.dispose);
    await _pumpListScreen(tester, errorController);
    await tester.pumpAndSettle();
    expect(find.text('Cotisations indisponibles'), findsOneWidget);
    expect(find.text('Réessayer'), findsOneWidget);
  });

  for (final size in const [Size(360, 800), Size(390, 844), Size(430, 932)]) {
    testWidgets('MOB-004/005 reflow ${size.width.toInt()}', (tester) async {
      await pumpCnpmApp(tester, size: size);
      await completeDemoSignIn(tester);
      _goToContributions(tester);
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);

      _goToContributionDetail(tester);
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('MOB-004/005 supportent un texte à 200 pour cent', (
    tester,
  ) async {
    await pumpCnpmApp(tester, size: const Size(360, 800), textScaleFactor: 2);
    await completeDemoSignIn(tester);
    _goToContributions(tester);
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    _goToContributionDetail(tester);
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}

Future<void> _pumpListScreen(
  WidgetTester tester,
  ContentController<List<MemberContribution>> controller,
) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: buildCnpmTheme(),
      home: ContributionListScreen(
        key: ValueKey(controller),
        controller: controller,
        isDemo: false,
        onSignOut: () {},
      ),
    ),
  );
  await tester.pump();
}

void _goToContributions(WidgetTester tester) {
  final context = tester.element(find.byKey(const Key('member-home-list')));
  GoRouter.of(context).go('/contributions');
}

void _goToContributionDetail(WidgetTester tester) {
  final context = tester.element(find.byKey(const Key('contribution-list')));
  GoRouter.of(context).go('/contributions/demo-contribution-2026-001');
}
