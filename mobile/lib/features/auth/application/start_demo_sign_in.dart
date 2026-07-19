import 'package:cnpm_mobile/features/auth/domain/auth_failure.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_gateway.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_start_result.dart';

final class StartDemoSignIn {
  const StartDemoSignIn(this._gateway);

  final AuthGateway _gateway;

  Future<AuthStartResult> call({
    required String email,
    required String password,
  }) async {
    final normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith('.invalid') || password.length < 8) {
      throw const AuthFailure(AuthFailureKind.invalidCredentials);
    }

    return _gateway.beginAuthorization(loginHint: normalizedEmail);
  }
}
