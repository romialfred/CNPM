final class AuthChallenge {
  const AuthChallenge({
    required this.id,
    required this.expiresAt,
    required this.isDemonstration,
  });

  final String id;
  final DateTime expiresAt;
  final bool isDemonstration;
}
