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
import 'package:cnpm_mobile/features/profile/domain/member_profile.dart';

class MemberProfileScreen extends StatefulWidget {
  const MemberProfileScreen({
    required this.controller,
    required this.isDemo,
    required this.onSignOut,
    super.key,
  });

  final ContentController<MemberProfileResult> controller;
  final bool isDemo;
  final VoidCallback onSignOut;

  @override
  State<MemberProfileScreen> createState() => _MemberProfileScreenState();
}

class _MemberProfileScreenState extends State<MemberProfileScreen> {
  @override
  void initState() {
    super.initState();
    widget.controller.ensureLoaded();
  }

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Profil et entreprise',
      selectedIndex: 4,
      onSignOut: widget.onSignOut,
      body: ListenableBuilder(
        listenable: widget.controller,
        builder: (context, child) {
          return ListView(
            key: const Key('member-profile-list'),
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            children: [
              Semantics(
                header: true,
                child: Text(
                  'Mon profil membre',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Text(
                'Consultez une projection synthétique de votre rattachement à l’entreprise.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: CnpmColors.textSecondary,
                  height: 1.4,
                ),
              ),
              if (widget.isDemo) ...[
                const SizedBox(height: CnpmSpacing.x4),
                const CnpmNotice(
                  message:
                      'Profil entièrement fictif et en lecture seule : aucune identité, coordonnée, photo ou donnée membre réelle n’est utilisée.',
                ),
              ],
              const SizedBox(height: CnpmSpacing.x5),
              switch (widget.controller.phase) {
                ContentPhase.idle ||
                ContentPhase.loading => const CnpmLoadingState(
                  label: 'Chargement du profil et de l’entreprise',
                ),
                ContentPhase.failure => CnpmErrorState(
                  onRetry: widget.controller.reload,
                  title: 'Erreur de chargement du profil',
                  message:
                      'La projection du profil n’a pas pu être chargée. Aucune donnée locale n’est modifiée.',
                ),
                ContentPhase.empty => const CnpmEmptyState(
                  title: 'Profil vide',
                  message:
                      'Aucune projection de profil ou d’entreprise n’est disponible pour cette session.',
                  icon: Icons.person_off_outlined,
                ),
                ContentPhase.ready => _ProfileResultContent(
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

class _ProfileResultContent extends StatelessWidget {
  const _ProfileResultContent({required this.result, required this.isDemo});

  final MemberProfileResult result;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    final current = result;
    if (current is MemberProfileUnavailable) {
      return _ProfileUnavailableState(reason: current.reason);
    }
    if (current is MemberProfileEmpty) {
      return const CnpmEmptyState(
        title: 'Profil vide',
        message:
            'Aucune projection de profil ou d’entreprise n’est disponible pour cette session.',
        icon: Icons.person_off_outlined,
      );
    }

    final profile = (current as MemberProfileAvailable).profile;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _IdentityCard(profile: profile),
        const SizedBox(height: CnpmSpacing.x4),
        _OrganizationCard(profile: profile),
        const SizedBox(height: CnpmSpacing.x4),
        CnpmNotice(message: profile.disclosure),
        const SizedBox(height: CnpmSpacing.x4),
        OutlinedButton.icon(
          key: const Key('profile-security-action'),
          onPressed: () => context.go('/security'),
          icon: const Icon(Icons.security_outlined),
          label: const Text('Consulter l’état de sécurité fictif'),
        ),
        if (isDemo) ...[
          const SizedBox(height: CnpmSpacing.x5),
          const CnpmSyncStatus.demo(),
        ],
      ],
    );
  }
}

class _IdentityCard extends StatelessWidget {
  const _IdentityCard({required this.profile});

  final MemberProfileSnapshot profile;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      key: const Key('profile-identity-card'),
      container: true,
      label: '${profile.displayLabel}. ${profile.roleLabel}. Lecture seule.',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(CnpmSpacing.x4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ExcludeSemantics(
                child: DecoratedBox(
                  decoration: const BoxDecoration(
                    color: CnpmColors.brandBlue50,
                    shape: BoxShape.circle,
                  ),
                  child: SizedBox.square(
                    dimension: CnpmSpacing.x12,
                    child: Icon(
                      Icons.person_outline,
                      color: CnpmColors.brandBlue,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: CnpmSpacing.x3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      profile.displayLabel,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: CnpmSpacing.x1),
                    Text(
                      profile.roleLabel,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: CnpmColors.textSecondary,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: CnpmSpacing.x3),
                    const CnpmStatusBadge(
                      label: 'Lecture seule — démonstration',
                      tone: CnpmStatusTone.info,
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

class _OrganizationCard extends StatelessWidget {
  const _OrganizationCard({required this.profile});

  final MemberProfileSnapshot profile;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      key: const Key('profile-organization-card'),
      container: true,
      label:
          'Entreprise fictive. ${profile.organizationName}. Référence ${profile.memberReference}. ${profile.organizationTypeLabel}. ${profile.membershipLabel}. Membre depuis le ${formatFrenchDate(profile.membershipSince)}.',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(CnpmSpacing.x4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Semantics(
                header: true,
                child: Text(
                  'Entreprise rattachée',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: CnpmSpacing.x3),
              _ProfileDataRow(
                label: 'Raison sociale fictive',
                value: profile.organizationName,
              ),
              _ProfileDataRow(
                label: 'Référence de démonstration',
                value: profile.memberReference,
              ),
              _ProfileDataRow(
                label: 'Type',
                value: profile.organizationTypeLabel,
              ),
              _ProfileDataRow(
                label: 'Situation',
                value: profile.membershipLabel,
              ),
              _ProfileDataRow(
                label: 'Membre depuis',
                value: formatFrenchDate(profile.membershipSince),
                showDivider: false,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileDataRow extends StatelessWidget {
  const _ProfileDataRow({
    required this.label,
    required this.value,
    this.showDivider = true,
  });

  final String label;
  final String value;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: CnpmSpacing.x2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(
                  context,
                ).textTheme.labelMedium?.copyWith(color: CnpmColors.textMuted),
              ),
              const SizedBox(height: CnpmSpacing.x1),
              Text(value, style: Theme.of(context).textTheme.bodyLarge),
            ],
          ),
        ),
        if (showDivider) const Divider(height: 1),
      ],
    );
  }
}

class _ProfileUnavailableState extends StatelessWidget {
  const _ProfileUnavailableState({required this.reason});

  final String reason;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CnpmSpacing.x6),
        child: Column(
          children: [
            const Icon(
              Icons.person_off_outlined,
              color: CnpmColors.brandBlue,
              size: CnpmSpacing.x8,
            ),
            const SizedBox(height: CnpmSpacing.x3),
            Semantics(
              header: true,
              child: Text(
                'Profil indisponible',
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
