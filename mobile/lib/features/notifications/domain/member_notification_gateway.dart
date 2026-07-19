import 'package:cnpm_mobile/features/notifications/domain/member_notification.dart';

abstract interface class MemberNotificationGateway {
  Future<MemberNotificationCollection> loadNotifications();
}
