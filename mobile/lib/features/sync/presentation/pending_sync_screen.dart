import 'package:flutter/material.dart';

import 'package:cnpm_mobile/app/mobile_app_shell.dart';
import 'package:cnpm_mobile/core/presentation/cnpm_formatters.dart';
import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_content_state.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_notice.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_status_badge.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_sync_status.dart';
import 'package:cnpm_mobile/features/sync/domain/pending_sync.dart';

class PendingSyncScreen extends StatefulWidget {
  const PendingSyncScreen({
    required this.controller,
    required this.isDemo,
    required this.onSignOut,
    super.key,
  });

  final ContentController<PendingSyncResult> controller;
  final bool isDemo;
  final VoidCallback onSignOut;

  @override
  State<PendingSyncScreen> createState() => _PendingSyncScreenState();
}

class _PendingSyncScreenState extends State<PendingSyncScreen> {
  @override
  void initState() {
    super.initState();
    widget.controller.ensureLoaded();
  }

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Synchronisation',
      selectedIndex: 4,
      onSignOut: widget.onSignOut,
      body: ListenableBuilder(
        listenable: widget.controller,
        builder: (context, child) {
          return ListView(
            key: const Key('pending-sync-list'),
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            children: [
              Semantics(
                header: true,
                child: Text(
                  'Synchronisation en attente',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Text(
                'Consultez les métadonnées fictives enregistrées localement, sans lancer leur transmission.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: CnpmColors.textSecondary,
                  height: 1.4,
                ),
              ),
              if (widget.isDemo) ...[
                const SizedBox(height: CnpmSpacing.x4),
                const CnpmNotice(
                  message:
                      'File locale de démonstration : les doublons sont neutralisés par clé, mais aucun réseau, contenu métier, document ou donnée sensible n’est utilisé.',
                ),
              ],
              const SizedBox(height: CnpmSpacing.x5),
              switch (widget.controller.phase) {
                ContentPhase.idle || ContentPhase.loading =>
                  const CnpmLoadingState(label: 'Chargement de la file locale'),
                ContentPhase.failure => CnpmErrorState(
                  onRetry: widget.controller.reload,
                  title: 'Erreur de lecture de la file locale',
                  message:
                      'La file n’a pas pu être relue. Aucun envoi ou changement métier n’est tenté.',
                ),
                ContentPhase.empty => const CnpmEmptyState(
                  title: 'Aucune synchronisation en attente',
                  message:
                      'Aucune métadonnée fictive n’est enregistrée dans la file locale.',
                  icon: Icons.sync_disabled_outlined,
                ),
                ContentPhase.ready => _PendingSyncResultContent(
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

class _PendingSyncResultContent extends StatelessWidget {
  const _PendingSyncResultContent({required this.result, required this.isDemo});

  final PendingSyncResult result;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    final current = result;
    if (current is PendingSyncUnavailable) {
      return _PendingSyncUnavailableState(reason: current.reason);
    }
    if (current is PendingSyncEmpty) {
      return const CnpmEmptyState(
        title: 'Aucune synchronisation en attente',
        message:
            'Aucune métadonnée fictive n’est enregistrée dans la file locale.',
        icon: Icons.sync_disabled_outlined,
      );
    }

    final items = (current as PendingSyncAvailable).items;
    if (items.isEmpty) {
      return const CnpmEmptyState(
        title: 'Aucune synchronisation en attente',
        message:
            'Aucune métadonnée fictive n’est enregistrée dans la file locale.',
        icon: Icons.sync_disabled_outlined,
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _PendingSyncSummary(count: items.length),
        const SizedBox(height: CnpmSpacing.x4),
        for (var index = 0; index < items.length; index++) ...[
          _PendingSyncCard(item: items[index]),
          if (index != items.length - 1) const SizedBox(height: CnpmSpacing.x3),
        ],
        const SizedBox(height: CnpmSpacing.x4),
        const CnpmNotice(
          message:
              'Aucune action Envoyer, Forcer, Annuler ou Valider n’est disponible. Une synchronisation réelle exigera un contrat serveur idempotent et une politique de conflits approuvée.',
        ),
        if (isDemo) ...[
          const SizedBox(height: CnpmSpacing.x5),
          const CnpmSyncStatus.demo(),
        ],
      ],
    );
  }
}

class _PendingSyncSummary extends StatelessWidget {
  const _PendingSyncSummary({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    final countLabel = count == 1
        ? '1 métadonnée locale'
        : '$count métadonnées locales';
    return Semantics(
      key: const Key('pending-sync-summary'),
      container: true,
      label:
          '$countLabel en attente dans la démonstration. Aucun envoi réseau.',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(CnpmSpacing.x4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const ExcludeSemantics(
                child: Icon(
                  Icons.sync_problem_outlined,
                  color: CnpmColors.warning,
                ),
              ),
              const SizedBox(width: CnpmSpacing.x3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'File locale',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: CnpmSpacing.x2),
                    CnpmStatusBadge(
                      label: '$countLabel en attente',
                      tone: CnpmStatusTone.warning,
                    ),
                    const SizedBox(height: CnpmSpacing.x2),
                    Text(
                      'Lecture seule — aucune tentative de synchronisation.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: CnpmColors.textSecondary,
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

class _PendingSyncCard extends StatelessWidget {
  const _PendingSyncCard({required this.item});

  final PendingSyncMetadata item;

  @override
  Widget build(BuildContext context) {
    const statusLabel = 'Enregistré localement — démonstration';
    return Semantics(
      key: Key('pending-sync-${item.id}'),
      container: true,
      label:
          '${item.label}. ${item.categoryLabel}. $statusLabel. Mise en file fictive le ${formatFrenchDate(item.queuedAt)}. ${item.disclosure}',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(CnpmSpacing.x4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                item.label,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: CnpmSpacing.x1),
              Text(
                item.categoryLabel,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: CnpmColors.textSecondary,
                ),
              ),
              const SizedBox(height: CnpmSpacing.x3),
              const Align(
                alignment: AlignmentDirectional.centerStart,
                child: CnpmStatusBadge(
                  label: statusLabel,
                  tone: CnpmStatusTone.info,
                ),
              ),
              const SizedBox(height: CnpmSpacing.x3),
              Text(
                'Mise en file fictive : ${formatFrenchDate(item.queuedAt)}',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: CnpmColors.textMuted),
              ),
              const Divider(height: CnpmSpacing.x5),
              Text(
                item.disclosure,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
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

class _PendingSyncUnavailableState extends StatelessWidget {
  const _PendingSyncUnavailableState({required this.reason});

  final String reason;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CnpmSpacing.x6),
        child: Column(
          children: [
            const Icon(
              Icons.sync_disabled_outlined,
              color: CnpmColors.brandBlue,
              size: CnpmSpacing.x8,
            ),
            const SizedBox(height: CnpmSpacing.x3),
            Semantics(
              header: true,
              child: Text(
                'File de synchronisation indisponible',
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
