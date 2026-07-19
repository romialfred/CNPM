import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/features/offline/domain/member_offline_status.dart';
import 'package:cnpm_mobile/features/offline/presentation/member_offline_status_screen.dart';
import 'package:cnpm_mobile/features/sync/domain/pending_sync.dart';
import 'package:cnpm_mobile/features/sync/presentation/pending_sync_screen.dart';

import 'helpers/test_app.dart';

void main() {
  testWidgets('MOB-018 distingue capacités locales et opérations bloquées', (
    tester,
  ) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);
    _go(tester, '/offline');
    await tester.pumpAndSettle();

    expect(find.text('Mode hors connexion'), findsOneWidget);
    expect(find.text('Hors connexion — scénario fictif'), findsOneWidget);
    expect(find.text('Aperçu local de démonstration'), findsOneWidget);
    await tester.drag(
      find.byKey(const Key('member-offline-status-list')),
      const Offset(0, -700),
    );
    await tester.pumpAndSettle();
    expect(find.text('Paiements, reçus et validations'), findsOneWidget);
    expect(find.text('Documents et pièces KYC'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Payer'), findsNothing);
    expect(find.widgetWithText(OutlinedButton, 'Valider'), findsNothing);
    expect(find.byType(TextField), findsNothing);
    expect(find.byType(TextFormField), findsNothing);
    expect(find.byType(Image), findsNothing);
  });

  testWidgets('MOB-019 affiche une file dédupliquée sans commande réseau', (
    tester,
  ) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);
    _go(tester, '/sync');
    await tester.pumpAndSettle();

    expect(find.text('Synchronisation en attente'), findsOneWidget);
    expect(find.text('2 métadonnées locales en attente'), findsOneWidget);
    expect(find.text('Métadonnée de brouillon fictif'), findsOneWidget);
    expect(find.textContaining('demo-dedup-'), findsNothing);
    expect(find.textContaining('FCFA'), findsNothing);
    expect(find.byType(TextField), findsNothing);
    expect(find.byType(TextFormField), findsNothing);

    for (final label in const [
      'Envoyer',
      'Forcer',
      'Annuler',
      'Valider',
      'Confirmer',
      'Réémettre',
    ]) {
      expect(find.widgetWithText(ElevatedButton, label), findsNothing);
      expect(find.widgetWithText(OutlinedButton, label), findsNothing);
      expect(find.widgetWithText(TextButton, label), findsNothing);
    }
  });

  testWidgets('Plus ouvre MOB-018/019 avec des cibles de 44 px', (
    tester,
  ) async {
    await pumpCnpmApp(tester, size: const Size(360, 800));
    await completeDemoSignIn(tester);

    await tester.tap(find.text('Plus'));
    await tester.pumpAndSettle();
    final offlineAction = find.byKey(const Key('more-offline-action'));
    await tester.ensureVisible(offlineAction);
    await tester.pumpAndSettle();
    expect(tester.getSize(offlineAction).height, greaterThanOrEqualTo(44));
    await tester.tap(offlineAction);
    await tester.pumpAndSettle();
    expect(find.text('Mode hors connexion'), findsOneWidget);

    final syncAction = find.byKey(const Key('offline-sync-action'));
    await tester.ensureVisible(syncAction);
    await tester.pumpAndSettle();
    expect(tester.getSize(syncAction).height, greaterThanOrEqualTo(44));
    await tester.tap(syncAction);
    await tester.pumpAndSettle();
    expect(find.text('Synchronisation en attente'), findsOneWidget);

    await tester.tap(find.text('Plus'));
    await tester.pumpAndSettle();
    final moreSync = find.byKey(const Key('more-sync-action'));
    await tester.ensureVisible(moreSync);
    await tester.pumpAndSettle();
    expect(tester.getSize(moreSync).height, greaterThanOrEqualTo(44));
    await tester.tap(moreSync);
    await tester.pumpAndSettle();
    expect(find.text('Synchronisation en attente'), findsOneWidget);
  });

  testWidgets('les routes hors connexion et sync exigent une session', (
    tester,
  ) async {
    await pumpCnpmApp(tester);

    _go(tester, '/offline');
    await tester.pumpAndSettle();
    expect(find.text('Connexion à votre compte'), findsOneWidget);
    expect(find.text('Mode hors connexion'), findsNothing);

    _go(tester, '/sync');
    await tester.pumpAndSettle();
    expect(find.text('Connexion à votre compte'), findsOneWidget);
    expect(find.text('Synchronisation en attente'), findsNothing);
  });

  testWidgets('MOB-018 couvre chargement, vide, erreur et indisponible', (
    tester,
  ) async {
    final pending = Completer<MemberOfflineStatusResult>();
    await _pumpOffline(tester, _offlineController(() => pending.future));
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await _pumpOffline(
      tester,
      _offlineController(() async => const MemberOfflineStatusEmpty()),
    );
    await tester.pumpAndSettle();
    expect(find.text('Aucun état local'), findsOneWidget);

    await _pumpOffline(
      tester,
      _offlineController(() => Future.error(StateError('indisponible'))),
    );
    await tester.pumpAndSettle();
    expect(
      find.text('Erreur de chargement du mode hors connexion'),
      findsOneWidget,
    );
    expect(find.text('Réessayer'), findsOneWidget);

    await _pumpOffline(
      tester,
      _offlineController(
        () async => const MemberOfflineStatusUnavailable('Contrat absent.'),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('État hors connexion indisponible'), findsOneWidget);
    expect(find.text('Contrat absent.'), findsOneWidget);
  });

  testWidgets('MOB-019 couvre chargement, vide, erreur et indisponible', (
    tester,
  ) async {
    final pending = Completer<PendingSyncResult>();
    await _pumpSync(tester, _syncController(() => pending.future));
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await _pumpSync(
      tester,
      _syncController(() async => const PendingSyncEmpty()),
    );
    await tester.pumpAndSettle();
    expect(find.text('Aucune synchronisation en attente'), findsOneWidget);

    await _pumpSync(
      tester,
      _syncController(() => Future.error(StateError('indisponible'))),
    );
    await tester.pumpAndSettle();
    expect(find.text('Erreur de lecture de la file locale'), findsOneWidget);
    expect(find.text('Réessayer'), findsOneWidget);

    await _pumpSync(
      tester,
      _syncController(
        () async => const PendingSyncUnavailable('Contrat absent.'),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('File de synchronisation indisponible'), findsOneWidget);
    expect(find.text('Contrat absent.'), findsOneWidget);
  });

  testWidgets('MOB-018/019 exposent des regroupements sémantiques', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);
    _go(tester, '/offline');
    await tester.pumpAndSettle();
    expect(
      find.bySemanticsLabel(
        RegExp('Hors connexion — scénario fictif.*réseau réel'),
      ),
      findsOneWidget,
    );

    _go(tester, '/sync');
    await tester.pumpAndSettle();
    expect(
      find.bySemanticsLabel(
        RegExp('2 métadonnées locales.*Aucun envoi réseau'),
      ),
      findsOneWidget,
    );
    semantics.dispose();
  });

  for (final size in const [Size(360, 800), Size(390, 844), Size(430, 932)]) {
    testWidgets('MOB-018/MOB-019 reflow ${size.width.toInt()}', (tester) async {
      await pumpCnpmApp(tester, size: size);
      await completeDemoSignIn(tester);
      _go(tester, '/offline');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);

      _go(tester, '/sync');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('MOB-018/MOB-019 supportent un texte à 200 pour cent', (
    tester,
  ) async {
    await pumpCnpmApp(tester, size: const Size(360, 800), textScaleFactor: 2);
    await completeDemoSignIn(tester);
    _go(tester, '/offline');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    _go(tester, '/sync');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    await tester.tap(find.text('Plus'));
    await tester.pumpAndSettle();
    final syncAction = find.byKey(const Key('more-sync-action'));
    await tester.ensureVisible(syncAction);
    await tester.pumpAndSettle();
    expect(tester.getSize(syncAction).height, greaterThanOrEqualTo(44));
    expect(tester.takeException(), isNull);
  });
}

ContentController<MemberOfflineStatusResult> _offlineController(
  Future<MemberOfflineStatusResult> Function() load,
) {
  final controller = ContentController<MemberOfflineStatusResult>(
    load: load,
    isEmpty: (result) => result is MemberOfflineStatusEmpty,
  );
  addTearDown(controller.dispose);
  return controller;
}

ContentController<PendingSyncResult> _syncController(
  Future<PendingSyncResult> Function() load,
) {
  final controller = ContentController<PendingSyncResult>(
    load: load,
    isEmpty: (result) => result is PendingSyncEmpty,
  );
  addTearDown(controller.dispose);
  return controller;
}

Future<void> _pumpOffline(
  WidgetTester tester,
  ContentController<MemberOfflineStatusResult> controller,
) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: buildCnpmTheme(),
      home: MemberOfflineStatusScreen(
        key: ValueKey(controller),
        controller: controller,
        isDemo: false,
        onSignOut: _noOp,
      ),
    ),
  );
  await tester.pump();
}

Future<void> _pumpSync(
  WidgetTester tester,
  ContentController<PendingSyncResult> controller,
) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: buildCnpmTheme(),
      home: PendingSyncScreen(
        key: ValueKey(controller),
        controller: controller,
        isDemo: false,
        onSignOut: _noOp,
      ),
    ),
  );
  await tester.pump();
}

void _go(WidgetTester tester, String path) {
  final context = tester.element(find.byType(Scaffold));
  GoRouter.of(context).go(path);
}

void _noOp() {}
