import 'package:cnpm_mobile/features/auth/domain/auth_challenge.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_gateway.dart';
import 'package:cnpm_mobile/features/auth/domain/member_session.dart';

final class VerifySecondFactor {
  const VerifySecondFactor(this._gateway);

  final AuthGateway _gateway;

  Future<MemberSession> call({
    required AuthChallenge challenge,
    required String code,
  }) {
    return _gateway.verifySecondFactor(challenge: challenge, code: code);
  }
}
