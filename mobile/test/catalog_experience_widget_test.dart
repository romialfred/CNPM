import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/features/documents/domain/member_document.dart';
import 'package:cnpm_mobile/features/documents/presentation/member_document_list_screen.dart';
import 'package:cnpm_mobile/features/notifications/domain/member_notification.dart';
import 'package:cnpm_mobile/features/notifications/presentation/member_notification_list_screen.dart';

import 'helpers/test_app.dart';

void main() {
  testWidgets('MOB-014 affiche un catalogue consultatif sans document actif', (
    tester,
  ) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);
    _go(tester, '/documents');
    await tester.pumpAndSettle();

    expect(find.text('Catalogue documentaire'), findsOneWidget);
    expect(find.text('DEMO-DOC-0001'), findsOneWidget);
    expect(find.text('Répertorié — démonstration'), findsOneWidget);
    expect(find.textContaining('aucun fichier, PDF'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Télécharger'), findsNothing);
    expect(find.widgetWithText(OutlinedButton, 'Télécharger'), findsNothing);
    expect(find.byIcon(Icons.download), findsNothing);
    expect(find.byIcon(Icons.qr_code), findsNothing);
    expect(find.byIcon(Icons.share), findsNothing);
  });

  testWidgets('MOB-015 affiche un historique local sans action serveur', (
    tester,
  ) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);
    _go(tester, '/notifications');
    await tester.pumpAndSettle();

    expect(find.text('Historique des notifications'), findsOneWidget);
    expect(find.text('Réponse fictive sur votre requête'), findsOneWidget);
    expect(
      find.textContaining('aucun push, e-mail ou SMS réel'),
      findsOneWidget,
    );
    expect(find.widgetWithText(TextButton, 'Marquer comme lu'), findsNothing);
    expect(find.widgetWithText(ElevatedButton, 'Préférences'), findsNothing);
    expect(find.byType(Switch), findsNothing);
    expect(find.byType(Checkbox), findsNothing);
  });

  testWidgets('les actions d’accueil ouvrent MOB-014/MOB-015 et font 44 px', (
    tester,
  ) async {
    await pumpCnpmApp(tester, size: const Size(360, 800));
    await completeDemoSignIn(tester);

    final documentsAction = find.byKey(const Key('home-documents-action'));
    await tester.ensureVisible(documentsAction);
    await tester.pumpAndSettle();
    expect(tester.getSize(documentsAction).height, greaterThanOrEqualTo(44));
    await tester.tap(documentsAction);
    await tester.pumpAndSettle();
    expect(find.text('Catalogue documentaire'), findsOneWidget);

    _go(tester, '/home');
    await tester.pumpAndSettle();
    final notificationsAction = find.byKey(
      const Key('home-notifications-action'),
    );
    await tester.ensureVisible(notificationsAction);
    await tester.pumpAndSettle();
    expect(
      tester.getSize(notificationsAction).height,
      greaterThanOrEqualTo(44),
    );
    await tester.tap(notificationsAction);
    await tester.pumpAndSettle();
    expect(find.text('Historique des notifications'), findsOneWidget);
  });

  testWidgets(
    'la destination Plus expose les deux routes avec cibles de 44 px',
    (tester) async {
      await pumpCnpmApp(tester, size: const Size(360, 800));
      await completeDemoSignIn(tester);

      await tester.tap(find.text('Plus'));
      await tester.pumpAndSettle();
      final documents = find.byKey(const Key('more-documents-action'));
      final notifications = find.byKey(const Key('more-notifications-action'));
      expect(tester.getSize(documents).height, greaterThanOrEqualTo(44));
      expect(tester.getSize(notifications).height, greaterThanOrEqualTo(44));
      await tester.tap(documents);
      await tester.pumpAndSettle();
      expect(find.text('Catalogue documentaire'), findsOneWidget);

      await tester.tap(find.text('Plus'));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('more-notifications-action')));
      await tester.pumpAndSettle();
      expect(find.text('Historique des notifications'), findsOneWidget);
    },
  );

  testWidgets('les routes documents et notifications sont authentifiées', (
    tester,
  ) async {
    await pumpCnpmApp(tester);

    _go(tester, '/documents');
    await tester.pumpAndSettle();
    expect(find.text('Connexion à votre compte'), findsOneWidget);
    expect(find.text('Catalogue documentaire'), findsNothing);

    _go(tester, '/notifications');
    await tester.pumpAndSettle();
    expect(find.text('Connexion à votre compte'), findsOneWidget);
    expect(find.text('Historique des notifications'), findsNothing);
  });

  testWidgets('MOB-014 couvre chargement, vide, erreur et indisponible', (
    tester,
  ) async {
    final pending = Completer<MemberDocumentCollection>();
    final loading = _documentController(() => pending.future);
    await _pumpDocuments(tester, loading);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    final empty = _documentController(
      () async => const MemberDocumentsAvailable([]),
    );
    await _pumpDocuments(tester, empty);
    await tester.pumpAndSettle();
    expect(find.text('Aucun document'), findsOneWidget);

    final error = _documentController(
      () => Future.error(StateError('indisponible')),
    );
    await _pumpDocuments(tester, error);
    await tester.pumpAndSettle();
    expect(find.text('Erreur de chargement des documents'), findsOneWidget);
    expect(find.text('Réessayer'), findsOneWidget);

    final unavailable = _documentController(
      () async => const MemberDocumentsUnavailable('Contrat générique.'),
    );
    await _pumpDocuments(tester, unavailable);
    await tester.pumpAndSettle();
    expect(find.text('Catalogue documentaire indisponible'), findsOneWidget);
    expect(find.text('Contrat générique.'), findsOneWidget);
  });

  testWidgets('MOB-015 couvre chargement, vide, erreur et indisponible', (
    tester,
  ) async {
    final pending = Completer<MemberNotificationCollection>();
    final loading = _notificationController(() => pending.future);
    await _pumpNotifications(tester, loading);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    final empty = _notificationController(
      () async => const MemberNotificationsAvailable([]),
    );
    await _pumpNotifications(tester, empty);
    await tester.pumpAndSettle();
    expect(find.text('Aucune notification'), findsOneWidget);

    final error = _notificationController(
      () => Future.error(StateError('indisponible')),
    );
    await _pumpNotifications(tester, error);
    await tester.pumpAndSettle();
    expect(find.text('Erreur de chargement des notifications'), findsOneWidget);
    expect(find.text('Réessayer'), findsOneWidget);

    final unavailable = _notificationController(
      () async => const MemberNotificationsUnavailable('Contrat absent.'),
    );
    await _pumpNotifications(tester, unavailable);
    await tester.pumpAndSettle();
    expect(
      find.text('Historique des notifications indisponible'),
      findsOneWidget,
    );
    expect(find.text('Contrat absent.'), findsOneWidget);
  });

  testWidgets('MOB-014/MOB-015 exposent des regroupements sémantiques', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);
    _go(tester, '/documents');
    await tester.pumpAndSettle();
    expect(
      find.bySemanticsLabel(RegExp('DEMO-DOC-0001.*Métadonnées consultatives')),
      findsOneWidget,
    );

    _go(tester, '/notifications');
    await tester.pumpAndSettle();
    expect(
      find.bySemanticsLabel(RegExp('Requête fictive.*sans envoi externe')),
      findsOneWidget,
    );
    semantics.dispose();
  });

  for (final size in const [Size(360, 800), Size(390, 844), Size(430, 932)]) {
    testWidgets('MOB-014/MOB-015 reflow ${size.width.toInt()}', (tester) async {
      await pumpCnpmApp(tester, size: size);
      await completeDemoSignIn(tester);
      _go(tester, '/documents');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);

      _go(tester, '/notifications');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('MOB-014/MOB-015 supportent un texte à 200 pour cent', (
    tester,
  ) async {
    await pumpCnpmApp(tester, size: const Size(360, 800), textScaleFactor: 2);
    await completeDemoSignIn(tester);
    _go(tester, '/documents');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    _go(tester, '/notifications');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}

ContentController<MemberDocumentCollection> _documentController(
  Future<MemberDocumentCollection> Function() load,
) {
  final controller = ContentController<MemberDocumentCollection>(
    load: load,
    isEmpty: (collection) => false,
  );
  addTearDown(controller.dispose);
  return controller;
}

ContentController<MemberNotificationCollection> _notificationController(
  Future<MemberNotificationCollection> Function() load,
) {
  final controller = ContentController<MemberNotificationCollection>(
    load: load,
    isEmpty: (collection) => false,
  );
  addTearDown(controller.dispose);
  return controller;
}

Future<void> _pumpDocuments(
  WidgetTester tester,
  ContentController<MemberDocumentCollection> controller,
) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: buildCnpmTheme(),
      home: MemberDocumentListScreen(
        key: ValueKey(controller),
        controller: controller,
        isDemo: false,
        onSignOut: _noOp,
      ),
    ),
  );
  await tester.pump();
}

Future<void> _pumpNotifications(
  WidgetTester tester,
  ContentController<MemberNotificationCollection> controller,
) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: buildCnpmTheme(),
      home: MemberNotificationListScreen(
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
