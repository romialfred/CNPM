import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/features/profile/domain/member_profile.dart';
import 'package:cnpm_mobile/features/profile/presentation/member_profile_screen.dart';
import 'package:cnpm_mobile/features/security/domain/member_security.dart';
import 'package:cnpm_mobile/features/security/presentation/member_security_screen.dart';

import 'helpers/test_app.dart';

void main() {
  testWidgets('MOB-016 affiche un profil fictif strictement en lecture seule', (
    tester,
  ) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);
    _go(tester, '/profile');
    await tester.pumpAndSettle();

    expect(find.text('Mon profil membre'), findsOneWidget);
    expect(find.text('Membre de démonstration'), findsOneWidget);
    expect(find.text('Entreprise Démo Sahel'), findsOneWidget);
    expect(find.text('CNPM-DEMO-0001'), findsOneWidget);
    expect(find.byType(TextField), findsNothing);
    expect(find.byType(TextFormField), findsNothing);
    expect(find.byType(Image), findsNothing);
    expect(find.widgetWithText(ElevatedButton, 'Modifier'), findsNothing);
    expect(find.widgetWithText(OutlinedButton, 'Modifier'), findsNothing);
    expect(find.textContaining('@'), findsNothing);
  });

  testWidgets('MOB-017 reste consultatif et sans commande sensible', (
    tester,
  ) async {
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);
    _go(tester, '/security');
    await tester.pumpAndSettle();

    expect(find.text('État de sécurité'), findsOneWidget);
    expect(find.text('Actif dans le scénario de connexion'), findsOneWidget);
    await tester.drag(
      find.byKey(const Key('member-security-list')),
      const Offset(0, -240),
    );
    await tester.pumpAndSettle();
    expect(find.text('Code à usage unique de démonstration'), findsOneWidget);
    expect(find.byType(TextField), findsNothing);
    expect(find.byType(TextFormField), findsNothing);
    expect(find.byType(Switch), findsNothing);
    expect(find.byType(Checkbox), findsNothing);
    expect(find.byIcon(Icons.qr_code), findsNothing);

    for (final label in const [
      'Révoquer',
      'Réinitialiser',
      'Configurer',
      'Activer',
      'Ajouter',
      'Enregistrer',
    ]) {
      expect(find.widgetWithText(ElevatedButton, label), findsNothing);
      expect(find.widgetWithText(OutlinedButton, label), findsNothing);
      expect(find.widgetWithText(TextButton, label), findsNothing);
    }
  });

  testWidgets('Plus ouvre Profil et Sécurité avec des cibles de 44 px', (
    tester,
  ) async {
    await pumpCnpmApp(tester, size: const Size(360, 800));
    await completeDemoSignIn(tester);

    await tester.tap(find.text('Plus'));
    await tester.pumpAndSettle();
    final profile = find.byKey(const Key('more-profile-action'));
    final security = find.byKey(const Key('more-security-action'));
    expect(tester.getSize(profile).height, greaterThanOrEqualTo(44));
    expect(tester.getSize(security).height, greaterThanOrEqualTo(44));
    await tester.tap(profile);
    await tester.pumpAndSettle();
    expect(find.text('Mon profil membre'), findsOneWidget);

    final profileSecurity = find.byKey(const Key('profile-security-action'));
    await tester.ensureVisible(profileSecurity);
    await tester.pumpAndSettle();
    expect(tester.getSize(profileSecurity).height, greaterThanOrEqualTo(44));
    await tester.tap(profileSecurity);
    await tester.pumpAndSettle();
    expect(find.text('État de sécurité'), findsOneWidget);

    await tester.tap(find.text('Plus'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('more-security-action')));
    await tester.pumpAndSettle();
    expect(find.text('État de sécurité'), findsOneWidget);
  });

  testWidgets('les routes profil et sécurité exigent une session', (
    tester,
  ) async {
    await pumpCnpmApp(tester);

    _go(tester, '/profile');
    await tester.pumpAndSettle();
    expect(find.text('Connexion à votre compte'), findsOneWidget);
    expect(find.text('Mon profil membre'), findsNothing);

    _go(tester, '/security');
    await tester.pumpAndSettle();
    expect(find.text('Connexion à votre compte'), findsOneWidget);
    expect(find.text('État de sécurité'), findsNothing);
  });

  testWidgets('MOB-016 couvre chargement, vide, erreur et indisponible', (
    tester,
  ) async {
    final pending = Completer<MemberProfileResult>();
    await _pumpProfile(tester, _profileController(() => pending.future));
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await _pumpProfile(
      tester,
      _profileController(() async => const MemberProfileEmpty()),
    );
    await tester.pumpAndSettle();
    expect(find.text('Profil vide'), findsOneWidget);

    await _pumpProfile(
      tester,
      _profileController(() => Future.error(StateError('indisponible'))),
    );
    await tester.pumpAndSettle();
    expect(find.text('Erreur de chargement du profil'), findsOneWidget);
    expect(find.text('Réessayer'), findsOneWidget);

    await _pumpProfile(
      tester,
      _profileController(
        () async => const MemberProfileUnavailable('Contrat absent.'),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Profil indisponible'), findsOneWidget);
    expect(find.text('Contrat absent.'), findsOneWidget);
  });

  testWidgets('MOB-017 couvre chargement, vide, erreur et indisponible', (
    tester,
  ) async {
    final pending = Completer<MemberSecurityResult>();
    await _pumpSecurity(tester, _securityController(() => pending.future));
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await _pumpSecurity(
      tester,
      _securityController(() async => const MemberSecurityEmpty()),
    );
    await tester.pumpAndSettle();
    expect(find.text('Aucun état de sécurité'), findsOneWidget);

    await _pumpSecurity(
      tester,
      _securityController(() => Future.error(StateError('indisponible'))),
    );
    await tester.pumpAndSettle();
    expect(find.text('Erreur de chargement de la sécurité'), findsOneWidget);
    expect(find.text('Réessayer'), findsOneWidget);

    await _pumpSecurity(
      tester,
      _securityController(
        () async => const MemberSecurityUnavailable('Contrat absent.'),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('État de sécurité indisponible'), findsOneWidget);
    expect(find.text('Contrat absent.'), findsOneWidget);
  });

  testWidgets('MOB-016/MOB-017 exposent des regroupements sémantiques', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await pumpCnpmApp(tester);
    await completeDemoSignIn(tester);
    _go(tester, '/profile');
    await tester.pumpAndSettle();
    expect(
      find.bySemanticsLabel(RegExp('Membre de démonstration.*Lecture seule')),
      findsOneWidget,
    );

    _go(tester, '/security');
    await tester.pumpAndSettle();
    expect(
      find.bySemanticsLabel(
        RegExp('Authentification à deux facteurs.*scénario'),
      ),
      findsOneWidget,
    );
    semantics.dispose();
  });

  for (final size in const [Size(360, 800), Size(390, 844), Size(430, 932)]) {
    testWidgets('MOB-016/MOB-017 reflow ${size.width.toInt()}', (tester) async {
      await pumpCnpmApp(tester, size: size);
      await completeDemoSignIn(tester);
      _go(tester, '/profile');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);

      _go(tester, '/security');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('MOB-016/MOB-017 supportent un texte à 200 pour cent', (
    tester,
  ) async {
    await pumpCnpmApp(tester, size: const Size(360, 800), textScaleFactor: 2);
    await completeDemoSignIn(tester);
    _go(tester, '/profile');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    _go(tester, '/security');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    await tester.tap(find.text('Plus'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    final securityAction = find.byKey(const Key('more-security-action'));
    await tester.ensureVisible(securityAction);
    await tester.pumpAndSettle();
    expect(tester.getSize(securityAction).height, greaterThanOrEqualTo(44));
    expect(tester.takeException(), isNull);
  });
}

ContentController<MemberProfileResult> _profileController(
  Future<MemberProfileResult> Function() load,
) {
  final controller = ContentController<MemberProfileResult>(
    load: load,
    isEmpty: (result) => result is MemberProfileEmpty,
  );
  addTearDown(controller.dispose);
  return controller;
}

ContentController<MemberSecurityResult> _securityController(
  Future<MemberSecurityResult> Function() load,
) {
  final controller = ContentController<MemberSecurityResult>(
    load: load,
    isEmpty: (result) => result is MemberSecurityEmpty,
  );
  addTearDown(controller.dispose);
  return controller;
}

Future<void> _pumpProfile(
  WidgetTester tester,
  ContentController<MemberProfileResult> controller,
) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: buildCnpmTheme(),
      home: MemberProfileScreen(
        key: ValueKey(controller),
        controller: controller,
        isDemo: false,
        onSignOut: _noOp,
      ),
    ),
  );
  await tester.pump();
}

Future<void> _pumpSecurity(
  WidgetTester tester,
  ContentController<MemberSecurityResult> controller,
) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: buildCnpmTheme(),
      home: MemberSecurityScreen(
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
