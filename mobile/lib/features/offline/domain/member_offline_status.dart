enum OfflineCapabilityAvailability { localOnly, blocked }

sealed class MemberOfflineStatusResult {
  const MemberOfflineStatusResult();
}

final class MemberOfflineStatusAvailable extends MemberOfflineStatusResult {
  const MemberOfflineStatusAvailable(this.status);

  final MemberOfflineStatusSnapshot status;
}

final class MemberOfflineStatusEmpty extends MemberOfflineStatusResult {
  const MemberOfflineStatusEmpty();
}

final class MemberOfflineStatusUnavailable extends MemberOfflineStatusResult {
  const MemberOfflineStatusUnavailable(this.reason);

  final String reason;
}

final class MemberOfflineStatusSnapshot {
  const MemberOfflineStatusSnapshot({
    required this.modeLabel,
    required this.observedAt,
    required this.summary,
    required this.capabilities,
    required this.disclosure,
  });

  final String modeLabel;
  final DateTime observedAt;
  final String summary;
  final List<OfflineCapabilitySnapshot> capabilities;
  final String disclosure;
}

final class OfflineCapabilitySnapshot {
  const OfflineCapabilitySnapshot({
    required this.id,
    required this.label,
    required this.detail,
    required this.availability,
  });

  final String id;
  final String label;
  final String detail;
  final OfflineCapabilityAvailability availability;
}
