import 'package:cnpm_mobile/features/notifications/domain/member_notification.dart';
import 'package:cnpm_mobile/features/notifications/domain/member_notification_gateway.dart';

final class LoadMemberNotifications {
  const LoadMemberNotifications(this._gateway);

  final MemberNotificationGateway _gateway;

  Future<MemberNotificationCollection> call() => _gateway.loadNotifications();
}
