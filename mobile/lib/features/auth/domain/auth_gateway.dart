import 'package:cnpm_mobile/features/auth/domain/auth_challenge.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_start_result.dart';
import 'package:cnpm_mobile/features/auth/domain/member_session.dart';

/// Boundary for the authentication provider.
///
/// A production adapter can launch an external OIDC Authorization Code with
/// PKCE flow and return only after its secure callback. Passwords never cross
/// this port and must never be relayed to the CNPM API.
abstract interface class AuthGateway {
  Future<AuthStartResult> beginAuthorization({String? loginHint});

  Future<MemberSession> verifySecondFactor({
    required AuthChallenge challenge,
    required String code,
  });
}
