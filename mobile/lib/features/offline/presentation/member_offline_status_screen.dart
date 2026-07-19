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
import 'package:cnpm_mobile/features/offline/domain/member_offline_status.dart';

class MemberOfflineStatusScreen extends StatefulWidget {
  const MemberOfflineStatusScreen({
    required this.controller,
    required this.isDemo,
    required this.onSignOut,
    super.key,
  });

  final ContentController<MemberOfflineStatusResult> controller;
  final bool isDemo;
  final VoidCallback onSignOut;

  @override
  State<MemberOfflineStatusScreen> createState() =>
      _MemberOfflineStatusScreenState();
}

class _MemberOfflineStatusScreenState extends State<MemberOfflineStatusScreen> {
  @override
  void initState() {
    super.initState();
    widget.controller.ensureLoaded();
  }

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Hors connexion',
      selectedIndex: 4,
      onSignOut: widget.onSignOut,
      body: ListenableBuilder(
        listenable: widget.controller,
        builder: (context, child) {
          return ListView(
            key: const Key('member-offline-status-list'),
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            children: [
              Semantics(
                header: true,
                child: Text(
                  'Mode hors connexion',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Text(
                'Identifiez ce que le scénario mobile autorise localement et ce qui exige toujours le serveur.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: CnpmColors.textSecondary,
                  height: 1.4,
                ),
              ),
              if (widget.isDemo) ...[
                const SizedBox(height: CnpmSpacing.x4),
                const CnpmNotice(
                  message:
                      'État fictif et consultatif : le réseau réel du téléphone n’est pas mesuré et aucune requête n’est émise.',
                ),
              ],
              const SizedBox(height: CnpmSpacing.x5),
              switch (widget.controller.phase) {
                ContentPhase.idle ||
                ContentPhase.loading => const CnpmLoadingState(
                  label: 'Chargement de l’état hors connexion',
                ),
                ContentPhase.failure => CnpmErrorState(
                  onRetry: widget.controller.reload,
                  title: 'Erreur de chargement du mode hors connexion',
                  message:
                      'L’état local n’a pas pu être relu. Aucune opération réseau ou métier n’est déclenchée.',
                ),
                ContentPhase.empty => const CnpmEmptyState(
                  title: 'Aucun état local',
                  message:
                      'Aucune projection de connectivité n’est disponible pour cette session.',
                  icon: Icons.cloud_off_outlined,
                ),
                ContentPhase.ready => _OfflineResultContent(
                  result: widget.controller.value!,
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

class _OfflineResultContent extends StatelessWidget {
  const _OfflineResultContent({required this.result, required this.isDemo});

  final MemberOfflineStatusResult result;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    final current = result;
    if (current is MemberOfflineStatusUnavailable) {
      return _OfflineUnavailableState(reason: current.reason);
    }
    if (current is MemberOfflineStatusEmpty) {
      return const CnpmEmptyState(
        title: 'Aucun état local',
        message:
            'Aucune projection de connectivité n’est disponible pour cette session.',
        icon: Icons.cloud_off_outlined,
      );
    }

    final status = (current as MemberOfflineStatusAvailable).status;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _ConnectivityCard(status: status),
        const SizedBox(height: CnpmSpacing.x5),
        Semantics(
          header: true,
          child: Text(
            'Capacités et limites',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
        const SizedBox(height: CnpmSpacing.x3),
        for (var index = 0; index < status.capabilities.length; index++) ...[
          _OfflineCapabilityCard(capability: status.capabilities[index]),
          if (index != status.capabilities.length - 1)
            const SizedBox(height: CnpmSpacing.x3),
        ],
        const SizedBox(height: CnpmSpacing.x4),
        CnpmNotice(message: status.disclosure),
        const SizedBox(height: CnpmSpacing.x4),
        OutlinedButton.icon(
          key: const Key('offline-sync-action'),
          onPressed: () => context.go('/sync'),
          icon: const Icon(Icons.sync_outlined),
          label: const Text('Consulter la file locale'),
        ),
        if (isDemo) ...[
          const SizedBox(height: CnpmSpacing.x5),
          const CnpmSyncStatus.demo(),
        ],
      ],
    );
  }
}

class _ConnectivityCard extends StatelessWidget {
  const _ConnectivityCard({required this.status});

  final MemberOfflineStatusSnapshot status;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      key: const Key('offline-connectivity-card'),
      container: true,
      label:
          '${status.modeLabel}. Observation fictive du ${formatFrenchDate(status.observedAt)}. ${status.summary}',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(CnpmSpacing.x4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const ExcludeSemantics(
                    child: Icon(
                      Icons.cloud_off_outlined,
                      color: CnpmColors.warning,
                    ),
                  ),
                  const SizedBox(width: CnpmSpacing.x2),
                  Expanded(
                    child: Text(
                      'Connectivité du scénario',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: CnpmSpacing.x3),
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: CnpmStatusBadge(
                  label: status.modeLabel,
                  tone: CnpmStatusTone.warning,
                ),
              ),
              const SizedBox(height: CnpmSpacing.x3),
              Text(
                status.summary,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: CnpmColors.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Text(
                'Observation locale fictive : ${formatFrenchDate(status.observedAt)}',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: CnpmColors.textMuted),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OfflineCapabilityCard extends StatelessWidget {
  const _OfflineCapabilityCard({required this.capability});

  final OfflineCapabilitySnapshot capability;

  @override
  Widget build(BuildContext context) {
    final isLocal =
        capability.availability == OfflineCapabilityAvailability.localOnly;
    final availabilityLabel = isLocal
        ? 'Local uniquement — démonstration'
        : 'Bloqué hors connexion';
    return Semantics(
      key: Key('offline-capability-${capability.id}'),
      container: true,
      label: '${capability.label}. $availabilityLabel. ${capability.detail}',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(CnpmSpacing.x4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                capability.label,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: CnpmStatusBadge(
                  label: availabilityLabel,
                  tone: isLocal ? CnpmStatusTone.info : CnpmStatusTone.neutral,
                ),
              ),
              const SizedBox(height: CnpmSpacing.x3),
              Text(
                capability.detail,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: CnpmColors.textSecondary,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OfflineUnavailableState extends StatelessWidget {
  const _OfflineUnavailableState({required this.reason});

  final String reason;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CnpmSpacing.x6),
        child: Column(
          children: [
            const Icon(
              Icons.cloud_off_outlined,
              color: CnpmColors.brandBlue,
              size: CnpmSpacing.x8,
            ),
            const SizedBox(height: CnpmSpacing.x3),
            Semantics(
              header: true,
              child: Text(
                'État hors connexion indisponible',
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
