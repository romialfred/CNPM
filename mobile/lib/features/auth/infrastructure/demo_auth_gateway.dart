import 'package:cnpm_mobile/features/auth/domain/auth_challenge.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_failure.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_gateway.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_start_result.dart';
import 'package:cnpm_mobile/features/auth/domain/member_session.dart';

typedef CurrentTime = DateTime Function();

final class DemoAuthGateway implements AuthGateway {
  DemoAuthGateway({CurrentTime? currentTime})
    : _currentTime = currentTime ?? DateTime.now;

  static const publicDemoCode = '123456';

  final CurrentTime _currentTime;

  @override
  Future<AuthStartResult> beginAuthorization({String? loginHint}) async {
    if (loginHint == null || !loginHint.endsWith('.invalid')) {
      throw const AuthFailure(AuthFailureKind.invalidCredentials);
    }

    final now = _currentTime();
    return SecondFactorRequired(
      AuthChallenge(
        id: 'demo-auth-challenge',
        expiresAt: now.add(const Duration(minutes: 5)),
        isDemonstration: true,
      ),
    );
  }

  @override
  Future<MemberSession> verifySecondFactor({
    required AuthChallenge challenge,
    required String code,
  }) async {
    if (challenge.id != 'demo-auth-challenge' ||
        !challenge.isDemonstration ||
        !_currentTime().isBefore(challenge.expiresAt)) {
      throw const AuthFailure(AuthFailureKind.expiredChallenge);
    }
    if (code != publicDemoCode) {
      throw const AuthFailure(AuthFailureKind.invalidSecondFactor);
    }

    return const MemberSession(
      displayName: 'Membre de démonstration',
      isDemonstration: true,
    );
  }
}
