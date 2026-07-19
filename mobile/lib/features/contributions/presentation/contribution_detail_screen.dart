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
import 'package:cnpm_mobile/features/contributions/application/load_member_contribution.dart';
import 'package:cnpm_mobile/features/contributions/domain/member_contribution.dart';

class ContributionDetailScreen extends StatefulWidget {
  const ContributionDetailScreen({
    required this.contributionId,
    required this.loadContribution,
    required this.isDemo,
    required this.onSignOut,
    super.key,
  });

  final String contributionId;
  final LoadMemberContribution loadContribution;
  final bool isDemo;
  final VoidCallback onSignOut;

  @override
  State<ContributionDetailScreen> createState() =>
      _ContributionDetailScreenState();
}

class _ContributionDetailScreenState extends State<ContributionDetailScreen> {
  late final ContentController<MemberContributionLookup> _controller;

  @override
  void initState() {
    super.initState();
    _controller = ContentController<MemberContributionLookup>(
      load: () => widget.loadContribution(widget.contributionId),
      isEmpty: (result) => false,
    );
    _controller.ensureLoaded();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Détail cotisation',
      selectedIndex: 1,
      onSignOut: widget.onSignOut,
      leading: IconButton(
        tooltip: 'Retour aux cotisations',
        onPressed: () => context.go('/contributions'),
        icon: const Icon(Icons.arrow_back),
      ),
      body: ListenableBuilder(
        listenable: _controller,
        builder: (context, child) {
          return ListView(
            key: const Key('contribution-detail'),
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            children: [
              Semantics(
                header: true,
                child: Text(
                  'Détail de la cotisation',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: CnpmSpacing.x4),
              switch (_controller.phase) {
                ContentPhase.idle ||
                ContentPhase.loading => const CnpmLoadingState(
                  label: 'Chargement du détail de la cotisation',
                ),
                ContentPhase.failure => CnpmErrorState(
                  onRetry: _controller.reload,
                  title: 'Détail indisponible',
                  message:
                      'La source sécurisée de cette cotisation n’est pas disponible. Réessayez lorsque le service CNPM est raccordé.',
                ),
                ContentPhase.empty => const SizedBox.shrink(),
                ContentPhase.ready => switch (_controller.value!) {
                  MemberContributionFound(:final contribution) =>
                    _ContributionDetail(
                      contribution: contribution,
                      isDemo: widget.isDemo,
                    ),
                  MemberContributionNotFound() => const _NotFoundState(),
                },
              },
            ],
          );
        },
      ),
    );
  }
}

class _ContributionDetail extends StatelessWidget {
  const _ContributionDetail({required this.contribution, required this.isDemo});

  final MemberContribution contribution;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    final (baseStatusLabel, statusTone) = switch (contribution.status) {
      MemberContributionStatus.issued => ('Appel émis', CnpmStatusTone.info),
      MemberContributionStatus.partiallySettled => (
        'Partiellement réglée',
        CnpmStatusTone.warning,
      ),
      MemberContributionStatus.settled => ('Encaissée', CnpmStatusTone.success),
    };
    final statusLabel = isDemo
        ? contribution.status == MemberContributionStatus.settled
              ? 'Réglée — démonstration'
              : '$baseStatusLabel — démonstration'
        : baseStatusLabel;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (isDemo) ...[
          const CnpmNotice(
            message:
                'Détail entièrement fictif et en lecture seule. Aucun montant affiché ne constitue une dette ou un encaissement officiel.',
          ),
          const SizedBox(height: CnpmSpacing.x4),
        ],
        Card(
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
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
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
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: CnpmColors.textSecondary,
                  ),
                ),
                const SizedBox(height: CnpmSpacing.x3),
                Text(
                  'Échéance fictive : ${formatFrenchDate(contribution.dueOn)}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: CnpmColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: CnpmSpacing.x6),
        const _SectionTitle(title: 'Situation indiquée'),
        const SizedBox(height: CnpmSpacing.x3),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            child: Column(
              children: [
                _DefinitionRow(
                  label: 'Montant appelé fictif',
                  value: formatXof(contribution.amountCalledXof),
                ),
                const Divider(height: CnpmSpacing.x5),
                _DefinitionRow(
                  label: 'Montant réglé fictif',
                  value: formatXof(contribution.amountSettledXof),
                ),
                const Divider(height: CnpmSpacing.x5),
                _DefinitionRow(
                  label: 'Solde indiqué fictif',
                  value: formatXof(contribution.balanceXof),
                  emphasized: true,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: CnpmSpacing.x6),
        const _SectionTitle(title: 'Échéancier fictif'),
        const SizedBox(height: CnpmSpacing.x3),
        for (
          var index = 0;
          index < contribution.installments.length;
          index++
        ) ...[
          _InstallmentCard(
            installment: contribution.installments[index],
            isDemo: isDemo,
          ),
          if (index != contribution.installments.length - 1)
            const SizedBox(height: CnpmSpacing.x3),
        ],
        const SizedBox(height: CnpmSpacing.x6),
        const _SectionTitle(title: 'Calcul et ajustements'),
        const SizedBox(height: CnpmSpacing.x3),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _Disclosure(
                  icon: Icons.rule_outlined,
                  title: 'Calcul non simulé',
                  message: contribution.calculationDisclosure,
                ),
                const Divider(height: CnpmSpacing.x6),
                _Disclosure(
                  icon: Icons.tune_outlined,
                  title: 'Ajustements',
                  message: contribution.adjustmentDisclosure,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: CnpmSpacing.x6),
        const _SectionTitle(title: 'Document d’appel'),
        const SizedBox(height: CnpmSpacing.x3),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            child: _Disclosure(
              icon: Icons.file_download_off_outlined,
              title: 'Téléchargement indisponible',
              message: contribution.documentDisclosure,
            ),
          ),
        ),
        if (isDemo) ...[
          const SizedBox(height: CnpmSpacing.x5),
          const CnpmSyncStatus.demo(),
        ],
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      header: true,
      child: Text(
        title,
        style: Theme.of(
          context,
        ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _DefinitionRow extends StatelessWidget {
  const _DefinitionRow({
    required this.label,
    required this.value,
    this.emphasized = false,
  });

  final String label;
  final String value;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
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
          style:
              (emphasized
                      ? Theme.of(context).textTheme.titleLarge
                      : Theme.of(context).textTheme.titleMedium)
                  ?.copyWith(
                    color: emphasized
                        ? CnpmColors.brandBlueDark
                        : CnpmColors.textPrimary,
                    fontWeight: FontWeight.w700,
                  ),
        ),
      ],
    );
  }
}

class _InstallmentCard extends StatelessWidget {
  const _InstallmentCard({required this.installment, required this.isDemo});

  final ContributionInstallment installment;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    final (baseLabel, tone) = switch (installment.dueState) {
      ContributionDueState.upcoming => ('À venir', CnpmStatusTone.info),
      ContributionDueState.overdue => ('Échue', CnpmStatusTone.error),
      ContributionDueState.settled => ('Réglée', CnpmStatusTone.success),
    };
    final label = isDemo ? '$baseLabel — démonstration' : baseLabel;

    return Semantics(
      container: true,
      label:
          'Échéance fictive ${installment.number}, $label, ${formatFrenchDate(installment.dueOn)}, montant appelé ${formatXof(installment.amountCalledXof)}, montant réglé ${formatXof(installment.amountSettledXof)}',
      child: Card(
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
                    'Échéance ${installment.number}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  CnpmStatusBadge(label: label, tone: tone),
                ],
              ),
              const SizedBox(height: CnpmSpacing.x3),
              Text(
                formatFrenchDate(installment.dueOn),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: CnpmColors.textSecondary,
                ),
              ),
              const SizedBox(height: CnpmSpacing.x3),
              _DefinitionRow(
                label: 'Montant appelé fictif',
                value: formatXof(installment.amountCalledXof),
              ),
              const SizedBox(height: CnpmSpacing.x3),
              _DefinitionRow(
                label: 'Montant réglé fictif',
                value: formatXof(installment.amountSettledXof),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Disclosure extends StatelessWidget {
  const _Disclosure({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: CnpmColors.brandBlue),
        const SizedBox(width: CnpmSpacing.x3),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(
                  context,
                ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: CnpmSpacing.x1),
              Text(
                message,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: CnpmColors.textSecondary,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _NotFoundState extends StatelessWidget {
  const _NotFoundState();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CnpmSpacing.x6),
        child: Column(
          children: [
            const Icon(
              Icons.find_in_page_outlined,
              color: CnpmColors.brandBlue,
              size: CnpmSpacing.x8,
            ),
            const SizedBox(height: CnpmSpacing.x3),
            Semantics(
              header: true,
              child: Text(
                'Cotisation introuvable',
                textAlign: TextAlign.center,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            const SizedBox(height: CnpmSpacing.x2),
            Text(
              'Cette référence n’est pas disponible pour la session membre.',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: CnpmColors.textSecondary),
            ),
            const SizedBox(height: CnpmSpacing.x4),
            OutlinedButton.icon(
              onPressed: () => context.go('/contributions'),
              icon: const Icon(Icons.arrow_back),
              label: const Text('Retour aux cotisations'),
            ),
          ],
        ),
      ),
    );
  }
}
