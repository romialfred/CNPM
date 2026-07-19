sealed class MemberProfileResult {
  const MemberProfileResult();
}

final class MemberProfileAvailable extends MemberProfileResult {
  const MemberProfileAvailable(this.profile);

  final MemberProfileSnapshot profile;
}

final class MemberProfileEmpty extends MemberProfileResult {
  const MemberProfileEmpty();
}

final class MemberProfileUnavailable extends MemberProfileResult {
  const MemberProfileUnavailable(this.reason);

  final String reason;
}

final class MemberProfileSnapshot {
  const MemberProfileSnapshot({
    required this.displayLabel,
    required this.roleLabel,
    required this.organizationName,
    required this.memberReference,
    required this.organizationTypeLabel,
    required this.membershipLabel,
    required this.membershipSince,
    required this.disclosure,
  });

  final String displayLabel;
  final String roleLabel;
  final String organizationName;
  final String memberReference;
  final String organizationTypeLabel;
  final String membershipLabel;
  final DateTime membershipSince;
  final String disclosure;
}
