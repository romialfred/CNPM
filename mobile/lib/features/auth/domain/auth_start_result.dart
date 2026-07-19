import 'package:cnpm_mobile/features/auth/domain/auth_challenge.dart';
import 'package:cnpm_mobile/features/auth/domain/member_session.dart';

sealed class AuthStartResult {
  const AuthStartResult();
}

final class SecondFactorRequired extends AuthStartResult {
  const SecondFactorRequired(this.challenge);

  final AuthChallenge challenge;
}

final class Authenticated extends AuthStartResult {
  const Authenticated(this.session);

  final MemberSession session;
}
