sealed class MemberSecurityResult {
  const MemberSecurityResult();
}

final class MemberSecurityAvailable extends MemberSecurityResult {
  const MemberSecurityAvailable(this.security);

  final MemberSecuritySnapshot security;
}

final class MemberSecurityEmpty extends MemberSecurityResult {
  const MemberSecurityEmpty();
}

final class MemberSecurityUnavailable extends MemberSecurityResult {
  const MemberSecurityUnavailable(this.reason);

  final String reason;
}

final class MemberSecuritySnapshot {
  const MemberSecuritySnapshot({
    required this.secondFactorLabel,
    required this.secondFactorDisclosure,
    required this.methods,
    required this.devices,
    required this.disclosure,
  });

  final String secondFactorLabel;
  final String secondFactorDisclosure;
  final List<SecurityMethodSnapshot> methods;
  final List<SecurityDeviceSnapshot> devices;
  final String disclosure;
}

final class SecurityMethodSnapshot {
  const SecurityMethodSnapshot({
    required this.id,
    required this.label,
    required this.statusLabel,
    required this.disclosure,
  });

  final String id;
  final String label;
  final String statusLabel;
  final String disclosure;
}

final class SecurityDeviceSnapshot {
  const SecurityDeviceSnapshot({
    required this.id,
    required this.label,
    required this.platformLabel,
    required this.lastActivityAt,
    required this.isCurrentSession,
  });

  final String id;
  final String label;
  final String platformLabel;
  final DateTime lastActivityAt;
  final bool isCurrentSession;
}
