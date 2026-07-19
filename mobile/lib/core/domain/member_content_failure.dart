enum MemberContentFailureKind { unavailable }

final class MemberContentFailure implements Exception {
  const MemberContentFailure(this.kind);

  final MemberContentFailureKind kind;
}
