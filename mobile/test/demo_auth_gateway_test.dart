import 'package:flutter_test/flutter_test.dart';

import 'package:cnpm_mobile/features/auth/domain/auth_failure.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_start_result.dart';
import 'package:cnpm_mobile/features/auth/application/start_demo_sign_in.dart';
import 'package:cnpm_mobile/features/auth/infrastructure/demo_auth_gateway.dart';

void main() {
  final now = DateTime.utc(2026, 7, 19, 12);

  test('le flux démo produit une session fictive sans jeton', () async {
    final gateway = DemoAuthGateway(currentTime: () => now);
    final result = await StartDemoSignIn(gateway)(
      email: 'membre@exemple.invalid',
      password: 'mot-de-passe-fictif',
    );
    final challenge = (result as SecondFactorRequired).challenge;
    final session = await gateway.verifySecondFactor(
      challenge: challenge,
      code: DemoAuthGateway.publicDemoCode,
    );

    expect(challenge.isDemonstration, isTrue);
    expect(session.isDemonstration, isTrue);
    expect(session.displayName, 'Membre de démonstration');
  });

  test('refuse une adresse qui ne relève pas du domaine réservé', () async {
    final gateway = DemoAuthGateway(currentTime: () => now);

    await expectLater(
      StartDemoSignIn(gateway)(
        email: 'membre@entreprise.ml',
        password: 'mot-de-passe-fictif',
      ),
      throwsA(
        isA<AuthFailure>().having(
          (failure) => failure.kind,
          'kind',
          AuthFailureKind.invalidCredentials,
        ),
      ),
    );
  });

  test('refuse un challenge expiré', () async {
    var currentTime = now;
    final gateway = DemoAuthGateway(currentTime: () => currentTime);
    final result = await StartDemoSignIn(gateway)(
      email: 'membre@exemple.invalid',
      password: 'mot-de-passe-fictif',
    );
    final challenge = (result as SecondFactorRequired).challenge;
    currentTime = now.add(const Duration(minutes: 6));

    await expectLater(
      gateway.verifySecondFactor(
        challenge: challenge,
        code: DemoAuthGateway.publicDemoCode,
      ),
      throwsA(
        isA<AuthFailure>().having(
          (failure) => failure.kind,
          'kind',
          AuthFailureKind.expiredChallenge,
        ),
      ),
    );
  });
}
