import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/app/mobile_app_shell.dart';
import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_content_state.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_notice.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_sync_status.dart';
import 'package:cnpm_mobile/features/home/domain/member_dashboard.dart';

class MemberHomeScreen extends StatefulWidget {
  const MemberHomeScreen({
    required this.controller,
    required this.displayName,
    required this.isDemo,
    required this.onSignOut,
    super.key,
  });

  final ContentController<MemberDashboard> controller;
  final String displayName;
  final bool isDemo;
  final VoidCallback onSignOut;

  @override
  State<MemberHomeScreen> createState() => _MemberHomeScreenState();
}

class _MemberHomeScreenState extends State<MemberHomeScreen> {
  @override
  void initState() {
    super.initState();
    widget.controller.ensureLoaded();
  }

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Espace membre',
      onSignOut: widget.onSignOut,
      body: ListenableBuilder(
        listenable: widget.controller,
        builder: (context, child) {
          return ListView(
            key: const Key('member-home-list'),
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            children: [
              if (widget.isDemo) ...[
                const CnpmNotice(
                  message:
                      'Mode démonstration : identité et activités entièrement fictives, sans connexion au serveur CNPM.',
                ),
                const SizedBox(height: CnpmSpacing.x5),
              ],
              Semantics(
                header: true,
                child: Text(
                  'Bonjour',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: CnpmSpacing.x1),
              Text(
                widget.displayName,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: CnpmColors.textSecondary,
                ),
              ),
              const SizedBox(height: CnpmSpacing.x5),
              switch (widget.controller.phase) {
                ContentPhase.idle ||
                ContentPhase.loading => const CnpmLoadingState(
                  label: 'Chargement de l’accueil membre',
                ),
                ContentPhase.failure => CnpmErrorState(
                  onRetry: widget.controller.reload,
                ),
                ContentPhase.empty => const CnpmEmptyState(
                  title: 'Compte membre indisponible',
                  message:
                      'Aucune synthèse membre ne peut être affichée pour cette session.',
                  icon: Icons.person_off_outlined,
                ),
                ContentPhase.ready => _MemberDashboardContent(
                  dashboard: widget.controller.value!,
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

class _MemberDashboardContent extends StatelessWidget {
  const _MemberDashboardContent({
    required this.dashboard,
    required this.isDemo,
  });

  final MemberDashboard dashboard;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(CnpmSpacing.x5),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const DecoratedBox(
                  decoration: BoxDecoration(
                    color: CnpmColors.brandBlue50,
                    shape: BoxShape.circle,
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(CnpmSpacing.x3),
                    child: Icon(
                      Icons.apartment_outlined,
                      color: CnpmColors.brandBlue,
                    ),
                  ),
                ),
                const SizedBox(width: CnpmSpacing.x3),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        dashboard.organizationName,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: CnpmSpacing.x1),
                      Text(
                        dashboard.memberReference,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: CnpmColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: CnpmSpacing.x2),
                      Text(
                        dashboard.accountLabel,
                        style: Theme.of(context).textTheme.labelMedium
                            ?.copyWith(
                              color: CnpmColors.brandBlue,
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: CnpmSpacing.x6),
        Semantics(
          header: true,
          child: Text(
            'À suivre',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
        const SizedBox(height: CnpmSpacing.x3),
        LayoutBuilder(
          builder: (context, constraints) {
            final textScale = MediaQuery.textScalerOf(context).scale(1);
            final stackCards = constraints.maxWidth < 350 || textScale > 1.35;
            final cardWidth = stackCards
                ? constraints.maxWidth
                : (constraints.maxWidth - CnpmSpacing.x3) / 2;

            return Wrap(
              spacing: CnpmSpacing.x3,
              runSpacing: CnpmSpacing.x3,
              children: [
                _SummaryCard(
                  width: cardWidth,
                  icon: Icons.account_balance_wallet_outlined,
                  value: dashboard.paymentsToReview.toString(),
                  label: 'paiements à suivre',
                  semanticsLabel:
                      '${dashboard.paymentsToReview} paiements de démonstration à suivre',
                ),
                _SummaryCard(
                  width: cardWidth,
                  icon: Icons.forum_outlined,
                  value: dashboard.openRequests.toString(),
                  label: 'requêtes ouvertes',
                  semanticsLabel:
                      '${dashboard.openRequests} requêtes de démonstration ouvertes',
                ),
              ],
            );
          },
        ),
        const SizedBox(height: CnpmSpacing.x6),
        Semantics(
          header: true,
          child: Text(
            'Actions essentielles',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
        const SizedBox(height: CnpmSpacing.x3),
        Card(
          child: Column(
            children: [
              _QuickAction(
                key: const Key('home-payments-action'),
                icon: Icons.account_balance_wallet_outlined,
                title: 'Mes paiements',
                subtitle: 'Consulter les opérations déclarées',
                onTap: () => context.go('/payments'),
              ),
              const Divider(height: 1),
              _QuickAction(
                key: const Key('home-requests-action'),
                icon: Icons.forum_outlined,
                title: 'Mes requêtes',
                subtitle: 'Suivre mes demandes et leurs statuts',
                onTap: () => context.go('/requests'),
              ),
            ],
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

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.width,
    required this.icon,
    required this.value,
    required this.label,
    required this.semanticsLabel,
  });

  final double width;
  final IconData icon;
  final String value;
  final String label;
  final String semanticsLabel;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: semanticsLabel,
      excludeSemantics: true,
      child: SizedBox(
        width: width,
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, color: CnpmColors.brandBlue),
                const SizedBox(height: CnpmSpacing.x3),
                Text(
                  value,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: CnpmSpacing.x1),
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: CnpmColors.textSecondary,
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

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    super.key,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '$title. $subtitle',
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          minHeight: CnpmSizes.minimumTouchTarget,
        ),
        child: ListTile(
          leading: Icon(icon, color: CnpmColors.brandBlue),
          title: Text(title),
          subtitle: Text(subtitle),
          trailing: const Icon(Icons.chevron_right),
          onTap: onTap,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: CnpmSpacing.x4,
            vertical: CnpmSpacing.x1,
          ),
        ),
      ),
    );
  }
}
