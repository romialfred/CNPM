import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/app/mobile_app_shell.dart';
import 'package:cnpm_mobile/core/presentation/cnpm_formatters.dart';
import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_content_state.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_notice.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_status_badge.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_sync_status.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request.dart';

class MemberRequestListScreen extends StatefulWidget {
  const MemberRequestListScreen({
    required this.controller,
    required this.isDemo,
    required this.onSignOut,
    super.key,
  });

  final ContentController<List<MemberRequest>> controller;
  final bool isDemo;
  final VoidCallback onSignOut;

  @override
  State<MemberRequestListScreen> createState() =>
      _MemberRequestListScreenState();
}

class _MemberRequestListScreenState extends State<MemberRequestListScreen> {
  @override
  void initState() {
    super.initState();
    widget.controller.ensureLoaded();
  }

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Mes requêtes',
      selectedIndex: 3,
      onSignOut: widget.onSignOut,
      body: ListenableBuilder(
        listenable: widget.controller,
        builder: (context, child) {
          return ListView(
            key: const Key('member-request-list'),
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            children: [
              Semantics(
                header: true,
                child: Text(
                  'Liste des requêtes',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Text(
                'Suivez vos demandes sans exposer les notes de traitement internes.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: CnpmColors.textSecondary,
                  height: 1.4,
                ),
              ),
              if (widget.isDemo) ...[
                const SizedBox(height: CnpmSpacing.x4),
                const CnpmNotice(
                  message:
                      'Mode démonstration : références, objets et statuts entièrement fictifs.',
                ),
              ],
              const SizedBox(height: CnpmSpacing.x4),
              ElevatedButton.icon(
                key: const Key('create-member-request'),
                onPressed: () => context.go('/requests/new'),
                icon: const Icon(Icons.add_comment_outlined),
                label: Text(
                  widget.isDemo
                      ? 'Créer une requête fictive'
                      : 'Créer une requête',
                ),
              ),
              const SizedBox(height: CnpmSpacing.x5),
              switch (widget.controller.phase) {
                ContentPhase.idle ||
                ContentPhase.loading => const CnpmLoadingState(
                  label: 'Chargement de la liste des requêtes',
                ),
                ContentPhase.failure => CnpmErrorState(
                  onRetry: widget.controller.reload,
                ),
                ContentPhase.empty => const CnpmEmptyState(
                  title: 'Aucune requête',
                  message:
                      'Aucune demande n’est disponible pour cette session.',
                  icon: Icons.forum_outlined,
                ),
                ContentPhase.ready => _RequestList(
                  requests: widget.controller.value!,
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

class _RequestList extends StatelessWidget {
  const _RequestList({required this.requests, required this.isDemo});

  final List<MemberRequest> requests;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '${requests.length} requêtes',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: CnpmSpacing.x3),
        for (var index = 0; index < requests.length; index++) ...[
          _RequestCard(
            request: requests[index],
            onTap: () => context.go('/requests/${requests[index].id}'),
          ),
          if (index != requests.length - 1)
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

class _RequestCard extends StatelessWidget {
  const _RequestCard({required this.request, required this.onTap});

  final MemberRequest request;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final (statusLabel, tone) = switch (request.status) {
      MemberRequestStatus.inProgress => ('En cours', CnpmStatusTone.info),
      MemberRequestStatus.awaitingMember => (
        'Votre réponse attendue',
        CnpmStatusTone.warning,
      ),
      MemberRequestStatus.resolved => ('Résolue', CnpmStatusTone.success),
    };

    return Semantics(
      container: true,
      button: true,
      label:
          '${request.reference}, ${request.subject}, statut $statusLabel. Voir la conversation partagée.',
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          key: Key('request-${request.id}'),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Wrap(
                  alignment: WrapAlignment.spaceBetween,
                  runSpacing: CnpmSpacing.x2,
                  spacing: CnpmSpacing.x3,
                  children: [
                    Text(
                      request.reference,
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: CnpmColors.brandBlue,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    CnpmStatusBadge(label: statusLabel, tone: tone),
                  ],
                ),
                const SizedBox(height: CnpmSpacing.x3),
                Text(
                  request.subject,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: CnpmSpacing.x2),
                Text(
                  request.categoryLabel,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: CnpmColors.textSecondary,
                  ),
                ),
                const SizedBox(height: CnpmSpacing.x3),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.calendar_today_outlined,
                      size: CnpmSpacing.x5,
                      color: CnpmColors.textMuted,
                    ),
                    const SizedBox(width: CnpmSpacing.x2),
                    Expanded(
                      child: Text(
                        'Créée le ${formatFrenchDate(request.createdOn)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: CnpmColors.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: CnpmSpacing.x3),
                Text(
                  'Voir la conversation',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: CnpmColors.brandBlue,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
