import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:cnpm_mobile/app/app_config.dart';

import 'helpers/test_app.dart';

void main() {
  group('MOB-001 connexion', () {
    testWidgets('affiche uniquement le parcours de démonstration autorisé', (
      tester,
    ) async {
      await pumpCnpmApp(tester);

      expect(find.text('Connexion à votre compte'), findsOneWidget);
      expect(find.text('MOB-001'), findsOneWidget);
      expect(find.textContaining('Mode démonstration'), findsOneWidget);
      expect(find.textContaining('Mot de passe oublié'), findsNothing);
      expect(find.textContaining('autre méthode'), findsNothing);
      expect(find.textContaining('support'), findsNothing);
    });

    testWidgets('valide les champs sans révéler de compte', (tester) async {
      await pumpCnpmApp(tester);

      await tester.tap(find.byKey(const Key('login-submit')));
      await tester.pump();

      expect(find.text('Saisissez une adresse e-mail.'), findsOneWidget);
      expect(find.text('Saisissez un mot de passe fictif.'), findsOneWidget);

      await tester.enterText(
        find.byKey(const Key('email-input')),
        'membre@entreprise.ml',
      );
      await tester.enterText(
        find.byKey(const Key('password-input')),
        'mot-de-passe-fictif',
      );
      await tester.tap(find.byKey(const Key('login-submit')));
      await tester.pump();

      expect(
        find.text('Utilisez une adresse fictive se terminant par .invalid.'),
        findsOneWidget,
      );
    });

    testWidgets('reste fermé hors du profil de démonstration', (tester) async {
      await pumpCnpmApp(
        tester,
        config: const AppConfig(authMode: AuthMode.unavailable),
      );

      expect(find.textContaining('client OIDC/PKCE Keycloak'), findsOneWidget);
      final submitButton = tester.widget<ElevatedButton>(
        find.byKey(const Key('login-submit')),
      );
      expect(submitButton.onPressed, isNull);
    });
  });

  group('MOB-002 vérification 2FA', () {
    testWidgets('refuse un code invalide puis ouvre le shell membre', (
      tester,
    ) async {
      await pumpCnpmApp(tester);
      await openTwoFactorScreen(tester);

      expect(find.text('Vérification en deux étapes'), findsOneWidget);
      expect(find.text('MOB-002'), findsOneWidget);
      expect(find.textContaining('aucun SMS ni e-mail'), findsOneWidget);
      expect(find.textContaining('123456'), findsOneWidget);
      expect(find.textContaining('Renvoyer'), findsNothing);
      expect(find.textContaining('autre méthode'), findsNothing);

      await tester.enterText(find.byKey(const Key('otp-input')), '000000');
      await tester.tap(find.byKey(const Key('verify-submit')));
      await tester.pumpAndSettle();

      expect(
        find.text('Vérification impossible. Vérifiez le code saisi.'),
        findsOneWidget,
      );

      await tester.enterText(find.byKey(const Key('otp-input')), '123456');
      await tester.tap(find.byKey(const Key('verify-submit')));
      await tester.pumpAndSettle();

      expect(find.text('Bonjour'), findsOneWidget);
      expect(find.text('Entreprise Démo Sahel'), findsOneWidget);
      for (final label in [
        'Accueil',
        'Paiements',
        'Reçus',
        'Requêtes',
        'Profil',
      ]) {
        expect(find.text(label), findsOneWidget);
      }
      expect(find.textContaining('Cotisation encaissée'), findsNothing);
      expect(find.textContaining('Taux de recouvrement'), findsNothing);
      expect(find.textContaining('Membres actifs'), findsNothing);
    });
  });
}
