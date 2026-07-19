enum MemberNotificationCategory { request, payment, document, account }

final class MemberNotification {
  const MemberNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.category,
    required this.occurredAt,
    required this.sourceDisclosure,
  });

  final String id;
  final String title;
  final String message;
  final MemberNotificationCategory category;
  final DateTime occurredAt;
  final String sourceDisclosure;
}

sealed class MemberNotificationCollection {
  const MemberNotificationCollection();
}

final class MemberNotificationsAvailable extends MemberNotificationCollection {
  const MemberNotificationsAvailable(this.notifications);

  final List<MemberNotification> notifications;
}

final class MemberNotificationsUnavailable
    extends MemberNotificationCollection {
  const MemberNotificationsUnavailable(this.reason);

  final String reason;
}
