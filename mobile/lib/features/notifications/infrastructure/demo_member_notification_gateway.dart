import 'package:cnpm_mobile/features/notifications/domain/member_notification.dart';
import 'package:cnpm_mobile/features/notifications/domain/member_notification_gateway.dart';

final class DemoMemberNotificationGateway implements MemberNotificationGateway {
  const DemoMemberNotificationGateway();

  @override
  Future<MemberNotificationCollection> loadNotifications() async {
    return MemberNotificationsAvailable([
      MemberNotification(
        id: 'demo-notification-0003',
        title: 'Réponse fictive sur votre requête',
        message:
            'Une réponse de démonstration est visible dans la conversation DEMO-REQ-0003.',
        category: MemberNotificationCategory.request,
        occurredAt: DateTime.utc(2026, 7, 17, 10, 5),
        sourceDisclosure: 'Événement local fictif, sans envoi externe.',
      ),
      MemberNotification(
        id: 'demo-notification-0002',
        title: 'Statut de paiement de démonstration mis à jour',
        message:
            'L’opération DEMO-PAY-0002 reste en traitement dans le scénario local.',
        category: MemberNotificationCategory.payment,
        occurredAt: DateTime.utc(2026, 7, 14, 8, 30),
        sourceDisclosure: 'Historique local fictif, sans message envoyé.',
      ),
      MemberNotification(
        id: 'demo-notification-0001',
        title: 'Métadonnée documentaire à vérifier',
        message:
            'DEMO-DOC-0003 illustre une échéance dépassée sans renouvellement automatique.',
        category: MemberNotificationCategory.document,
        occurredAt: DateTime.utc(2026, 7, 8, 15, 45),
        sourceDisclosure: 'Rappel local fictif, sans push, e-mail ou SMS.',
      ),
    ]);
  }
}
