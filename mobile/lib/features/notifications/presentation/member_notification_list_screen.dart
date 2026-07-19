import 'package:flutter/material.dart';

import 'package:cnpm_mobile/app/mobile_app_shell.dart';
import 'package:cnpm_mobile/core/presentation/cnpm_formatters.dart';
import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_content_state.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_notice.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_sync_status.dart';
import 'package:cnpm_mobile/features/notifications/domain/member_notification.dart';

class MemberNotificationListScreen extends StatefulWidget {
  const MemberNotificationListScreen({
    required this.controller,
    required this.isDemo,
    required this.onSignOut,
    super.key,
  });

  final ContentController<MemberNotificationCollection> controller;
  final bool isDemo;
  final VoidCallback onSignOut;

  @override
  State<MemberNotificationListScreen> createState() =>
      _MemberNotificationListScreenState();
}

class _MemberNotificationListScreenState
    extends State<MemberNotificationListScreen> {
  @override
  void initState() {
    super.initState();
    widget.controller.ensureLoaded();
  }

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Notifications',
      selectedIndex: 4,
      onSignOut: widget.onSignOut,
      body: ListenableBuilder(
        listenable: widget.controller,
        builder: (context, child) {
          return ListView(
            key: const Key('member-notification-list'),
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            children: [
              Semantics(
                header: true,
                child: Text(
                  'Historique des notifications',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Text(
                'Retrouvez les événements fictifs conservés localement pour la démonstration.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: CnpmColors.textSecondary,
                  height: 1.4,
                ),
              ),
              if (widget.isDemo) ...[
                const SizedBox(height: CnpmSpacing.x4),
                const CnpmNotice(
                  message:
                      'Historique local fictif : aucun push, e-mail ou SMS réel n’est envoyé. Aucun état lu/non-lu, accusé serveur ou préférence n’est enregistré.',
                ),
              ],
              const SizedBox(height: CnpmSpacing.x5),
              switch (widget.controller.phase) {
                ContentPhase.idle ||
                ContentPhase.loading => const CnpmLoadingState(
                  label: 'Chargement de l’historique des notifications',
                ),
                ContentPhase.failure => CnpmErrorState(
                  onRetry: widget.controller.reload,
                  title: 'Erreur de chargement des notifications',
                  message:
                      'L’historique local n’a pas pu être chargé. Réessayez sans déclencher d’envoi.',
                ),
                ContentPhase.empty => const CnpmEmptyState(
                  title: 'Aucune notification',
                  message:
                      'Aucun événement de démonstration n’est disponible pour cette session.',
                  icon: Icons.notifications_none_outlined,
                ),
                ContentPhase.ready => _NotificationCollectionContent(
                  collection: widget.controller.value!,
                  isDemo: widget.isDemo,
                ),
              },
            ],
          );
        },
      ),
    );
  }
}

class _NotificationCollectionContent extends StatelessWidget {
  const _NotificationCollectionContent({
    required this.collection,
    required this.isDemo,
  });

  final MemberNotificationCollection collection;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    final current = collection;
    if (current is MemberNotificationsUnavailable) {
      return _NotificationUnavailableState(reason: current.reason);
    }

    final notifications =
        (current as MemberNotificationsAvailable).notifications;
    if (notifications.isEmpty) {
      return const CnpmEmptyState(
        title: 'Aucune notification',
        message:
            'Aucun événement de démonstration n’est disponible pour cette session.',
        icon: Icons.notifications_none_outlined,
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          notifications.length == 1
              ? '1 événement fictif'
              : '${notifications.length} événements fictifs',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: CnpmSpacing.x3),
        for (var index = 0; index < notifications.length; index++) ...[
          _NotificationCard(notification: notifications[index]),
          if (index != notifications.length - 1)
            const SizedBox(height: CnpmSpacing.x3),
        ],
        if (isDemo) ...[
          const SizedBox(height: CnpmSpacing.x5),
          const CnpmSyncStatus.demo(),
        ],
      ],
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.notification});

  final MemberNotification notification;

  @override
  Widget build(BuildContext context) {
    final (categoryLabel, icon) = _categoryView(notification.category);
    return Semantics(
      key: Key('notification-${notification.id}'),
      container: true,
      label:
          '$categoryLabel, ${notification.title}, ${notification.message}, ${formatFrenchDate(notification.occurredAt)}. ${notification.sourceDisclosure}',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(CnpmSpacing.x4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DecoratedBox(
                decoration: const BoxDecoration(
                  color: CnpmColors.brandBlue50,
                  shape: BoxShape.circle,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(CnpmSpacing.x3),
                  child: Icon(icon, color: CnpmColors.brandBlue),
                ),
              ),
              const SizedBox(width: CnpmSpacing.x3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      categoryLabel,
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: CnpmColors.brandBlue,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: CnpmSpacing.x1),
                    Text(
                      notification.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: CnpmSpacing.x2),
                    Text(
                      notification.message,
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(height: 1.4),
                    ),
                    const SizedBox(height: CnpmSpacing.x2),
                    Text(
                      formatFrenchDate(notification.occurredAt),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: CnpmColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: CnpmSpacing.x2),
                    Text(
                      notification.sourceDisclosure,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: CnpmColors.textSecondary,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotificationUnavailableState extends StatelessWidget {
  const _NotificationUnavailableState({required this.reason});

  final String reason;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CnpmSpacing.x6),
        child: Column(
          children: [
            const Icon(
              Icons.notifications_off_outlined,
              color: CnpmColors.brandBlue,
              size: CnpmSpacing.x8,
            ),
            const SizedBox(height: CnpmSpacing.x3),
            Semantics(
              header: true,
              child: Text(
                'Historique des notifications indisponible',
                textAlign: TextAlign.center,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            const SizedBox(height: CnpmSpacing.x2),
            Text(
              reason,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: CnpmColors.textSecondary,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

(String, IconData) _categoryView(MemberNotificationCategory category) {
  return switch (category) {
    MemberNotificationCategory.request => (
      'Requête fictive',
      Icons.forum_outlined,
    ),
    MemberNotificationCategory.payment => (
      'Paiement fictif',
      Icons.account_balance_wallet_outlined,
    ),
    MemberNotificationCategory.document => (
      'Document fictif',
      Icons.description_outlined,
    ),
    MemberNotificationCategory.account => (
      'Compte fictif',
      Icons.person_outline,
    ),
  };
}
