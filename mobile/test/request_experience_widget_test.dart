import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/features/requests/application/add_shared_request_message.dart';
import 'package:cnpm_mobile/features/requests/application/load_member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request_gateway.dart';
import 'package:cnpm_mobile/features/requests/presentation/member_request_conversation_screen.dart';

import 'helpers/test_app.dart';

void main() {
  testWidgets('MOB-012 valide, focalise le résumé et conserve les champs', (
    tester,
  ) async {
    await pumpCnpmApp(tester, size: const Size(390, 844));
    await completeDemoSignIn(tester);
    _go(tester, '/requests/new');
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('request-step-one-continue')));
    await tester.pump();

    expect(find.text('Corrigez les champs suivants'), findsOneWidget);
    expect(
      FocusManager.instance.primaryFocus?.debugLabel,
      'request-error-summary',
    );

    await tester.tap(find.byKey(const Key('request-category-field')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Information générale').last);
    await tester.enterText(
      find.byKey(const Key('request-subject-field')),
      'Question fictive sur le portail',
    );
    await tester.ensureVisible(
      find.byKey(const Key('request-step-one-continue')),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('request-step-one-continue')));
    await tester.pumpAndSettle();

    await tester.enterText(
      find.byKey(const Key('request-description-field')),
      'Cette description fictive contient assez de caractères pour être validée.',
    );
    await tester.enterText(
      find.byKey(const Key('request-attachment-name-field')),
      'document-demo.txt',
    );
    await tester.ensureVisible(
      find.byKey(const Key('request-step-two-continue')),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('request-step-two-continue')));
    await tester.pumpAndSettle();

    expect(find.text('Vérification'), findsWidgets);
    expect(find.text('Question fictive sur le portail'), findsOneWidget);
    expect(find.textContaining('document-demo.txt'), findsOneWidget);
    expect(find.textContaining('aucun fichier téléversé'), findsOneWidget);
  });

  testWidgets('MOB-012 crée un accusé fictif et ouvre MOB-013', (tester) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);
    _go(tester, '/requests/new');
    await tester.pumpAndSettle();

    await _completeRequestWizard(tester);
    await tester.ensureVisible(
      find.byKey(const Key('create-fictional-request')),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('create-fictional-request')));
    await tester.pumpAndSettle();

    expect(find.text('Conversation membre'), findsOneWidget);
    expect(find.text('DEMO-REQ-0004'), findsOneWidget);
    expect(find.text('Conversation partagée'), findsOneWidget);
    expect(find.textContaining('Note interne'), findsNothing);
    expect(find.textContaining('aucun fichier téléversé'), findsWidgets);
  });

  testWidgets('MOB-013 ajoute une réponse fictive sans doublon', (
    tester,
  ) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);
    _go(tester, '/requests/demo-request-0003');
    await tester.pumpAndSettle();

    final field = find.byKey(const Key('shared-reply-field'));
    await tester.ensureVisible(field);
    await tester.enterText(field, 'Ma réponse membre fictive.');
    final submit = find.byKey(const Key('send-shared-reply'));
    await tester.ensureVisible(submit);
    await tester.tap(submit);
    await tester.pumpAndSettle();

    expect(find.text('Ma réponse membre fictive.'), findsOneWidget);
    expect(find.textContaining('Note interne'), findsNothing);
  });

  testWidgets('les deep links MOB-012/MOB-013 restent authentifiés', (
    tester,
  ) async {
    await pumpCnpmApp(tester);

    _go(tester, '/requests/demo-request-0003');
    await tester.pumpAndSettle();
    expect(find.text('Connexion à votre compte'), findsOneWidget);
    expect(find.text('Conversation membre'), findsNothing);

    _go(tester, '/requests/new');
    await tester.pumpAndSettle();
    expect(find.text('Connexion à votre compte'), findsOneWidget);
  });

  testWidgets('MOB-013 distingue not-found et indisponible', (tester) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);
    _go(tester, '/requests/reference-inconnue');
    await tester.pumpAndSettle();
    expect(find.text('Requête introuvable'), findsOneWidget);

    const unavailable = _RequestGatewayStub(
      lookup: MemberRequestUnavailable('Contrat conversation non typé.'),
    );
    await _pumpConversation(tester, unavailable);
    await tester.pumpAndSettle();
    expect(find.text('Conversation non connectée'), findsOneWidget);
    expect(find.text('Contrat conversation non typé.'), findsOneWidget);
  });

  testWidgets('MOB-013 couvre chargement et erreur récupérable', (
    tester,
  ) async {
    final pending = Completer<MemberRequestLookup>();
    final loading = _RequestGatewayStub(futureLookup: pending.future);
    await _pumpConversation(tester, loading);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    const failing = _RequestGatewayStub(throwsOnLookup: true);
    await _pumpConversation(tester, failing);
    await tester.pumpAndSettle();
    expect(find.text('Conversation indisponible'), findsOneWidget);
    expect(find.text('Réessayer'), findsOneWidget);
  });

  testWidgets('MOB-011 expose une carte et une action de 44 px minimum', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await pumpCnpmApp(tester, size: const Size(360, 800));
    await completeDemoSignIn(tester);
    _go(tester, '/requests');
    await tester.pumpAndSettle();

    final create = find.byKey(const Key('create-member-request'));
    final card = find.byKey(const Key('request-demo-request-0003'));
    expect(tester.getSize(create).height, greaterThanOrEqualTo(44));
    expect(tester.getSize(card).height, greaterThanOrEqualTo(44));
    expect(
      find.bySemanticsLabel(RegExp('DEMO-REQ-0003.*conversation partagée')),
      findsOneWidget,
    );
    semantics.dispose();
  });

  for (final size in const [Size(360, 800), Size(390, 844), Size(430, 932)]) {
    testWidgets('MOB-012/013 reflow ${size.width.toInt()}', (tester) async {
      await pumpCnpmApp(tester, size: size);
      await completeDemoSignIn(tester);
      _go(tester, '/requests/new');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);

      _go(tester, '/requests/demo-request-0003');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('MOB-012/013 supportent un texte à 200 pour cent', (
    tester,
  ) async {
    await pumpCnpmApp(tester, size: const Size(360, 800), textScaleFactor: 2);
    await completeDemoSignIn(tester);
    _go(tester, '/requests/new');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    _go(tester, '/requests/demo-request-0003');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}

Future<void> _completeRequestWizard(WidgetTester tester) async {
  await tester.tap(find.byKey(const Key('request-category-field')));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Données du membre').last);
  await tester.enterText(
    find.byKey(const Key('request-subject-field')),
    'Mise à jour fictive',
  );
  await tester.ensureVisible(
    find.byKey(const Key('request-step-one-continue')),
  );
  await tester.pumpAndSettle();
  await tester.tap(find.byKey(const Key('request-step-one-continue')));
  await tester.pumpAndSettle();
  await tester.enterText(
    find.byKey(const Key('request-description-field')),
    'Description de démonstration assez longue pour la validation.',
  );
  await tester.enterText(
    find.byKey(const Key('request-attachment-name-field')),
    'piece-fictive.pdf',
  );
  await tester.ensureVisible(
    find.byKey(const Key('request-step-two-continue')),
  );
  await tester.pumpAndSettle();
  await tester.tap(find.byKey(const Key('request-step-two-continue')));
  await tester.pumpAndSettle();
}

void _go(WidgetTester tester, String path) {
  final context = tester.element(find.byType(Scaffold));
  GoRouter.of(context).go(path);
}

Future<void> _pumpConversation(
  WidgetTester tester,
  MemberRequestGateway gateway,
) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: buildCnpmTheme(),
      home: MemberRequestConversationScreen(
        key: ValueKey(gateway),
        requestId: 'demo',
        loadMemberRequest: LoadMemberRequest(gateway),
        addSharedRequestMessage: AddSharedRequestMessage(gateway),
        isDemo: false,
        onSignOut: _noOp,
      ),
    ),
  );
  await tester.pump();
}

void _noOp() {}

final class _RequestGatewayStub implements MemberRequestGateway {
  const _RequestGatewayStub({
    this.lookup,
    this.futureLookup,
    this.throwsOnLookup = false,
  });

  final MemberRequestLookup? lookup;
  final Future<MemberRequestLookup>? futureLookup;
  final bool throwsOnLookup;

  @override
  Future<MemberRequestLookup> findRequest(String id) {
    if (throwsOnLookup) {
      return Future.error(StateError('indisponible'));
    }
    return futureLookup ??
        Future.value(lookup ?? const MemberRequestNotFound());
  }

  @override
  Future<SharedRequestMessageResult> addSharedMessage({
    required String requestId,
    required String body,
  }) async => const SharedRequestMessageUnavailable('Indisponible.');

  @override
  Future<MemberRequestCreationResult> createRequest(
    NewMemberRequestDraft draft,
  ) async => const MemberRequestCreationUnavailable('Indisponible.');

  @override
  Future<List<MemberRequest>> loadRequests() async => const [];
}
