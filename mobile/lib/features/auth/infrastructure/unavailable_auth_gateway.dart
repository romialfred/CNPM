import 'package:cnpm_mobile/features/auth/domain/auth_challenge.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_failure.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_gateway.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_start_result.dart';
import 'package:cnpm_mobile/features/auth/domain/member_session.dart';

/// Closed-by-default adapter used until the OIDC/PKCE client is implemented.
final class UnavailableAuthGateway implements AuthGateway {
  const UnavailableAuthGateway();

  @override
  Future<AuthStartResult> beginAuthorization({String? loginHint}) {
    throw const AuthFailure(AuthFailureKind.unavailable);
  }

  @override
  Future<MemberSession> verifySecondFactor({
    required AuthChallenge challenge,
    required String code,
  }) {
    throw const AuthFailure(AuthFailureKind.unavailable);
  }
}
