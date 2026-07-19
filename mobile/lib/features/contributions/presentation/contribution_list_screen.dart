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
import 'package:cnpm_mobile/features/contributions/domain/member_contribution.dart';

class ContributionListScreen extends StatefulWidget {
  const ContributionListScreen({
    required this.controller,
    required this.isDemo,
    required this.onSignOut,
    super.key,
  });

  final ContentController<List<MemberContribution>> controller;
  final bool isDemo;
  final VoidCallback onSignOut;

  @override
  State<ContributionListScreen> createState() => _ContributionListScreenState();
}

class _ContributionListScreenState extends State<ContributionListScreen> {
  @override
  void initState() {
    super.initState();
    widget.controller.ensureLoaded();
  }

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Mes cotisations',
      selectedIndex: 1,
      onSignOut: widget.onSignOut,
      body: ListenableBuilder(
        listenable: widget.controller,
        builder: (context, child) {
          return ListView(
            key: const Key('contribution-list'),
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            children: [
              Semantics(
                header: true,
                child: Text(
                  'Liste des cotisations',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Text(
                'Consultez les appels et leurs soldes indiqués, sans opération financière depuis le mobile.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: CnpmColors.textSecondary,
                  height: 1.4,
                ),
              ),
              if (widget.isDemo) ...[
                const SizedBox(height: CnpmSpacing.x4),
                const CnpmNotice(
                  message:
                      'Données entièrement fictives : montants, références et échéances ne constituent aucun appel officiel du CNPM.',
                ),
              ],
              const SizedBox(height: CnpmSpacing.x5),
              switch (widget.controller.phase) {
                ContentPhase.idle ||
                ContentPhase.loading => const CnpmLoadingState(
                  label: 'Chargement de la liste des cotisations',
                ),
                ContentPhase.failure => CnpmErrorState(
                  onRetry: widget.controller.reload,
                  title: 'Cotisations indisponibles',
                  message:
                      'La source sécurisée des cotisations n’est pas disponible. Réessayez lorsque le service CNPM est raccordé.',
                ),
                ContentPhase.empty => const CnpmEmptyState(
                  title: 'Aucune cotisation',
                  message:
                      'Aucun appel de cotisation n’est disponible pour cette session.',
                  icon: Icons.file_copy_outlined,
                ),
                ContentPhase.ready => _ContributionList(
                  contributions: widget.controller.value!,
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

class _ContributionList extends StatelessWidget {
  const _ContributionList({required this.contributions, required this.isDemo});

  final List<MemberContribution> contributions;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '${contributions.length} cotisations fictives',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: CnpmSpacing.x3),
        for (var index = 0; index < contributions.length; index++) ...[
          _ContributionCard(contribution: contributions[index], isDemo: isDemo),
          if (index != contributions.length - 1)
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

class _ContributionCard extends StatelessWidget {
  const _ContributionCard({required this.contribution, required this.isDemo});

  final MemberContribution contribution;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    final (statusLabel, statusTone) = _statusView(
      contribution.status,
      isDemo: isDemo,
    );
    final (dueLabel, dueIcon, dueColor) = _dueView(contribution.dueState);

    return Semantics(
      button: true,
      container: true,
      excludeSemantics: true,
      label:
          '${contribution.reference}, ${contribution.periodLabel}, statut $statusLabel, montant appelé fictif ${formatXof(contribution.amountCalledXof)}, solde fictif ${formatXof(contribution.balanceXof)}, $dueLabel le ${formatFrenchDate(contribution.dueOn)}. Ouvrir le détail.',
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          key: Key('contribution-${contribution.id}'),
          onTap: () => context.go('/contributions/${contribution.id}'),
          child: Padding(
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Wrap(
                  alignment: WrapAlignment.spaceBetween,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  runSpacing: CnpmSpacing.x2,
                  spacing: CnpmSpacing.x3,
                  children: [
                    Text(
                      contribution.reference,
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: CnpmColors.brandBlue,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    CnpmStatusBadge(label: statusLabel, tone: statusTone),
                  ],
                ),
                const SizedBox(height: CnpmSpacing.x3),
                Text(
                  contribution.periodLabel,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: CnpmSpacing.x4),
                _AmountValue(
                  label: 'Montant appelé fictif',
                  value: formatXof(contribution.amountCalledXof),
                ),
                const SizedBox(height: CnpmSpacing.x3),
                _AmountValue(
                  label: 'Solde indiqué fictif',
                  value: formatXof(contribution.balanceXof),
                ),
                const SizedBox(height: CnpmSpacing.x4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(dueIcon, size: CnpmSpacing.x5, color: dueColor),
                    const SizedBox(width: CnpmSpacing.x2),
                    Expanded(
                      child: Text(
                        '$dueLabel : ${formatFrenchDate(contribution.dueOn)}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: dueColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: CnpmSpacing.x4),
                ExcludeSemantics(
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Voir le détail',
                          style: Theme.of(context).textTheme.labelLarge
                              ?.copyWith(
                                color: CnpmColors.brandBlue,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(width: CnpmSpacing.x1),
                        const Icon(
                          Icons.chevron_right,
                          color: CnpmColors.brandBlue,
                        ),
                      ],
                    ),
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

class _AmountValue extends StatelessWidget {
  const _AmountValue({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: CnpmColors.textSecondary),
        ),
        const SizedBox(height: CnpmSpacing.x1),
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: CnpmColors.brandBlueDark,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

(String, CnpmStatusTone) _statusView(
  MemberContributionStatus status, {
  required bool isDemo,
}) {
  final (label, tone) = switch (status) {
    MemberContributionStatus.issued => ('Appel émis', CnpmStatusTone.info),
    MemberContributionStatus.partiallySettled => (
      'Partiellement réglée',
      CnpmStatusTone.warning,
    ),
    MemberContributionStatus.settled => ('Encaissée', CnpmStatusTone.success),
  };
  if (isDemo && status == MemberContributionStatus.settled) {
    return ('Réglée — démonstration', tone);
  }
  return (isDemo ? '$label — démonstration' : label, tone);
}

(String, IconData, Color) _dueView(ContributionDueState dueState) {
  return switch (dueState) {
    ContributionDueState.upcoming => (
      'Échéance fictive à venir',
      Icons.event_outlined,
      CnpmColors.info,
    ),
    ContributionDueState.overdue => (
      'Échéance fictive passée',
      Icons.event_busy_outlined,
      CnpmColors.error,
    ),
    ContributionDueState.settled => (
      'Échéance fictive clôturée',
      Icons.event_available_outlined,
      CnpmColors.success,
    ),
  };
}
