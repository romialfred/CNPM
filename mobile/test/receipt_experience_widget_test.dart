import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/features/receipts/application/load_member_receipt.dart';
import 'package:cnpm_mobile/features/receipts/domain/member_receipt.dart';
import 'package:cnpm_mobile/features/receipts/domain/member_receipt_gateway.dart';
import 'package:cnpm_mobile/features/receipts/presentation/receipt_detail_screen.dart';
import 'package:cnpm_mobile/features/receipts/presentation/receipt_list_screen.dart';

import 'helpers/test_app.dart';

void main() {
  testWidgets('MOB-009 ouvre une liste fictive depuis la navigation réelle', (
    tester,
  ) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);

    await tester.tap(find.text('Reçus'));
    await tester.pumpAndSettle();

    expect(find.text('Liste des reçus'), findsOneWidget);
    expect(find.text('DEMO-APERCU-2026-001'), findsOneWidget);
    expect(find.text('Aperçu disponible — démonstration'), findsOneWidget);
    expect(find.text('Aperçu annulé — démonstration'), findsOneWidget);
    expect(
      find.textContaining('aucun élément affiché n’est un reçu officiel'),
      findsOneWidget,
    );
    expect(find.text('Télécharger'), findsNothing);
    expect(find.text('Partager'), findsNothing);
  });

  testWidgets('l’action d’accueil Mes reçus ouvre MOB-009 et mesure 44 px', (
    tester,
  ) async {
    await pumpCnpmApp(tester, size: const Size(360, 800));
    await completeDemoSignIn(tester);

    final action = find.byKey(const Key('home-receipts-action'));
    await tester.drag(
      find.byKey(const Key('member-home-list')),
      const Offset(0, -760),
    );
    await tester.pumpAndSettle();
    expect(tester.getSize(action).height, greaterThanOrEqualTo(44));
    await tester.tap(action);
    await tester.pumpAndSettle();

    expect(find.text('Liste des reçus'), findsOneWidget);
  });

  testWidgets('MOB-009 expose une cible de carte unique de 44 px minimum', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await pumpCnpmApp(tester, size: const Size(360, 800));
    await completeDemoSignIn(tester);
    _goToReceipts(tester);
    await tester.pumpAndSettle();

    const cardKey = Key('receipt-demo-receipt-preview-2026-001');
    final card = find.byKey(cardKey);
    expect(card, findsOneWidget);
    expect(tester.getSize(card).height, greaterThanOrEqualTo(44));
    expect(
      find.bySemanticsLabel(
        RegExp('Aperçu fictif DEMO-APERCU-2026-001.*Ouvrir l’aperçu'),
      ),
      findsOneWidget,
    );
    expect(
      find.descendant(of: card, matching: find.byType(TextButton)),
      findsNothing,
    );

    semantics.dispose();
  });

  testWidgets('MOB-010 montre provenance et indisponibilité de la preuve', (
    tester,
  ) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);
    _goToReceiptDetail(tester);
    await tester.pumpAndSettle();

    expect(find.text('Aperçu détaillé'), findsOneWidget);
    expect(find.text('APERÇU DE DÉMONSTRATION'), findsOneWidget);
    expect(find.text('Provenance démonstrative'), findsOneWidget);
    expect(find.text('Source fictive'), findsOneWidget);
    expect(
      find.textContaining('Source : scénario fictif local'),
      findsOneWidget,
    );
    expect(
      find.text('Téléchargement et partage indisponibles'),
      findsOneWidget,
    );
    expect(
      find.textContaining('Aucun PDF, QR, cachet ou signature n’est généré'),
      findsOneWidget,
    );
    expect(find.byIcon(Icons.qr_code), findsNothing);
    expect(find.byIcon(Icons.share), findsNothing);
    expect(find.widgetWithText(ElevatedButton, 'Télécharger'), findsNothing);
    expect(find.widgetWithText(OutlinedButton, 'Partager'), findsNothing);
  });

  testWidgets('les deep links reçus restent authentifiés', (tester) async {
    await pumpCnpmApp(tester);

    final context = tester.element(find.byType(Scaffold));
    GoRouter.of(context).go('/receipts/demo-receipt-preview-2026-001');
    await tester.pumpAndSettle();

    expect(find.text('Connexion à votre compte'), findsOneWidget);
    expect(find.text('Aperçu détaillé'), findsNothing);
  });

  testWidgets('un deep link authentifié inconnu rend not-found', (
    tester,
  ) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);

    final context = tester.element(find.byKey(const Key('member-home-list')));
    GoRouter.of(context).go('/receipts/reference-inconnue');
    await tester.pumpAndSettle();

    expect(find.text('Aperçu introuvable'), findsOneWidget);
    expect(find.text('Retour aux reçus'), findsOneWidget);
  });

  testWidgets('MOB-009 couvre chargement, vide, erreur et indisponible', (
    tester,
  ) async {
    final completer = Completer<MemberReceiptCollection>();
    final loadingController = ContentController<MemberReceiptCollection>(
      load: () => completer.future,
      isEmpty: (collection) => false,
    );
    addTearDown(loadingController.dispose);
    await _pumpListScreen(tester, loadingController);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    final emptyController = ContentController<MemberReceiptCollection>(
      load: () async => const MemberReceiptsAvailable([]),
      isEmpty: (collection) => false,
    );
    addTearDown(emptyController.dispose);
    await _pumpListScreen(tester, emptyController);
    await tester.pumpAndSettle();
    expect(find.text('Aucun reçu'), findsOneWidget);

    final errorController = ContentController<MemberReceiptCollection>(
      load: () => Future.error(StateError('indisponible')),
      isEmpty: (collection) => false,
    );
    addTearDown(errorController.dispose);
    await _pumpListScreen(tester, errorController);
    await tester.pumpAndSettle();
    expect(find.text('Erreur de chargement des reçus'), findsOneWidget);
    expect(find.text('Réessayer'), findsOneWidget);

    final unavailableController = ContentController<MemberReceiptCollection>(
      load: () async =>
          const MemberReceiptsUnavailable('Contrat documentaire non typé.'),
      isEmpty: (collection) => false,
    );
    addTearDown(unavailableController.dispose);
    await _pumpListScreen(tester, unavailableController);
    await tester.pumpAndSettle();
    expect(find.text('Service de reçus indisponible'), findsOneWidget);
    expect(find.text('Contrat documentaire non typé.'), findsOneWidget);
    expect(find.text('Réessayer'), findsNothing);
  });

  testWidgets('MOB-010 couvre l’état indisponible distinct de not-found', (
    tester,
  ) async {
    const gateway = _ReceiptGatewayStub(
      lookup: MemberReceiptUnavailable('Contrat documentaire non typé.'),
    );
    await tester.pumpWidget(
      MaterialApp(
        theme: buildCnpmTheme(),
        home: ReceiptDetailScreen(
          receiptId: 'demo',
          loadReceipt: LoadMemberReceipt(gateway),
          isDemo: false,
          onSignOut: _noOp,
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Service de reçus indisponible'), findsOneWidget);
    expect(find.text('Aperçu introuvable'), findsNothing);
  });

  for (final size in const [Size(360, 800), Size(390, 844), Size(430, 932)]) {
    testWidgets('MOB-009/010 reflow ${size.width.toInt()}', (tester) async {
      await pumpCnpmApp(tester, size: size);
      await completeDemoSignIn(tester);
      _goToReceipts(tester);
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);

      _goToReceiptDetail(tester);
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('MOB-009/010 supportent un texte à 200 pour cent', (
    tester,
  ) async {
    await pumpCnpmApp(tester, size: const Size(360, 800), textScaleFactor: 2);
    await completeDemoSignIn(tester);
    _goToReceipts(tester);
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    _goToReceiptDetail(tester);
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}

Future<void> _pumpListScreen(
  WidgetTester tester,
  ContentController<MemberReceiptCollection> controller,
) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: buildCnpmTheme(),
      home: ReceiptListScreen(
        key: ValueKey(controller),
        controller: controller,
        isDemo: false,
        onSignOut: _noOp,
      ),
    ),
  );
  await tester.pump();
}

void _goToReceipts(WidgetTester tester) {
  final context = tester.element(find.byKey(const Key('member-home-list')));
  GoRouter.of(context).go('/receipts');
}

void _goToReceiptDetail(WidgetTester tester) {
  final context = tester.element(
    find.byKey(const Key('receipt-list')).evaluate().isNotEmpty
        ? find.byKey(const Key('receipt-list'))
        : find.byKey(const Key('member-home-list')),
  );
  GoRouter.of(context).go('/receipts/demo-receipt-preview-2026-001');
}

void _noOp() {}

final class _ReceiptGatewayStub implements MemberReceiptGateway {
  const _ReceiptGatewayStub({required this.lookup});

  final MemberReceiptLookup lookup;

  @override
  Future<MemberReceiptLookup> findReceipt(String id) async => lookup;

  @override
  Future<MemberReceiptCollection> loadReceipts() async =>
      const MemberReceiptsAvailable([]);
}
