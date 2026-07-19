enum AuthFailureKind {
  invalidCredentials,
  invalidSecondFactor,
  expiredChallenge,
  unavailable,
}

final class AuthFailure implements Exception {
  const AuthFailure(this.kind);

  final AuthFailureKind kind;
}
