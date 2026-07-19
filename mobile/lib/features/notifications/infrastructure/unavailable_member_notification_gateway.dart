import 'package:cnpm_mobile/features/notifications/domain/member_notification.dart';
import 'package:cnpm_mobile/features/notifications/domain/member_notification_gateway.dart';

final class UnavailableMemberNotificationGateway
    implements MemberNotificationGateway {
  const UnavailableMemberNotificationGateway();

  @override
  Future<MemberNotificationCollection> loadNotifications() async {
    return const MemberNotificationsUnavailable(
      'Aucun contrat REST typé ne fournit l’historique membre. Les événements internes ne sont pas interprétés comme des notifications reçues.',
    );
  }
}
