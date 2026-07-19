import 'package:flutter/material.dart';

import 'package:cnpm_mobile/app/mobile_app_shell.dart';
import 'package:cnpm_mobile/core/presentation/cnpm_formatters.dart';
import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_content_state.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_notice.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_status_badge.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_sync_status.dart';
import 'package:cnpm_mobile/features/security/domain/member_security.dart';

class MemberSecurityScreen extends StatefulWidget {
  const MemberSecurityScreen({
    required this.controller,
    required this.isDemo,
    required this.onSignOut,
    super.key,
  });

  final ContentController<MemberSecurityResult> controller;
  final bool isDemo;
  final VoidCallback onSignOut;

  @override
  State<MemberSecurityScreen> createState() => _MemberSecurityScreenState();
}

class _MemberSecurityScreenState extends State<MemberSecurityScreen> {
  @override
  void initState() {
    super.initState();
    widget.controller.ensureLoaded();
  }

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Sécurité et appareils',
      selectedIndex: 4,
      onSignOut: widget.onSignOut,
      body: ListenableBuilder(
        listenable: widget.controller,
        builder: (context, child) {
          return ListView(
            key: const Key('member-security-list'),
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            children: [
              Semantics(
                header: true,
                child: Text(
                  'État de sécurité',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Text(
                'Consultez l’état fictif des méthodes de connexion et des appareils associés au scénario.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: CnpmColors.textSecondary,
                  height: 1.4,
                ),
              ),
              if (widget.isDemo) ...[
                const SizedBox(height: CnpmSpacing.x4),
                const CnpmNotice(
                  message:
                      'Vue strictement consultative : aucun secret, QR, identifiant d’appareil, IP ou localisation réelle n’est affiché. Aucune réinitialisation, révocation ou inscription n’est exécutée.',
                ),
              ],
              const SizedBox(height: CnpmSpacing.x5),
              switch (widget.controller.phase) {
                ContentPhase.idle ||
                ContentPhase.loading => const CnpmLoadingState(
                  label: 'Chargement de l’état de sécurité',
                ),
                ContentPhase.failure => CnpmErrorState(
                  onRetry: widget.controller.reload,
                  title: 'Erreur de chargement de la sécurité',
                  message:
                      'L’état consultatif n’a pas pu être chargé. Aucune méthode ni session n’est modifiée.',
                ),
                ContentPhase.empty => const CnpmEmptyState(
                  title: 'Aucun état de sécurité',
                  message:
                      'Aucune projection de méthode ou d’appareil n’est disponible pour cette session.',
                  icon: Icons.security_outlined,
                ),
                ContentPhase.ready => _SecurityResultContent(
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

class _SecurityResultContent extends StatelessWidget {
  const _SecurityResultContent({required this.result, required this.isDemo});

  final MemberSecurityResult result;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    final current = result;
    if (current is MemberSecurityUnavailable) {
      return _SecurityUnavailableState(reason: current.reason);
    }
    if (current is MemberSecurityEmpty) {
      return const CnpmEmptyState(
        title: 'Aucun état de sécurité',
        message:
            'Aucune projection de méthode ou d’appareil n’est disponible pour cette session.',
        icon: Icons.security_outlined,
      );
    }

    final security = (current as MemberSecurityAvailable).security;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _SecondFactorCard(security: security),
        const SizedBox(height: CnpmSpacing.x5),
        const _SectionHeading(
          title: 'Méthodes de connexion',
          subtitle: 'Informations fictives, sans configuration locale.',
        ),
        const SizedBox(height: CnpmSpacing.x3),
        if (security.methods.isEmpty)
          const CnpmEmptyState(
            title: 'Aucune méthode',
            message: 'Aucune méthode fictive n’est associée à ce scénario.',
            icon: Icons.key_off_outlined,
          )
        else
          for (var index = 0; index < security.methods.length; index++) ...[
            _SecurityMethodCard(method: security.methods[index]),
            if (index != security.methods.length - 1)
              const SizedBox(height: CnpmSpacing.x3),
          ],
        const SizedBox(height: CnpmSpacing.x5),
        const _SectionHeading(
          title: 'Appareils et sessions',
          subtitle:
              'Libellés de scénario uniquement, sans empreinte technique.',
        ),
        const SizedBox(height: CnpmSpacing.x3),
        if (security.devices.isEmpty)
          const CnpmEmptyState(
            title: 'Aucun appareil',
            message: 'Aucun appareil fictif n’est associé à ce scénario.',
            icon: Icons.devices_other_outlined,
          )
        else
          for (var index = 0; index < security.devices.length; index++) ...[
            _SecurityDeviceCard(device: security.devices[index]),
            if (index != security.devices.length - 1)
              const SizedBox(height: CnpmSpacing.x3),
          ],
        const SizedBox(height: CnpmSpacing.x4),
        CnpmNotice(message: security.disclosure),
        if (isDemo) ...[
          const SizedBox(height: CnpmSpacing.x5),
          const CnpmSyncStatus.demo(),
        ],
      ],
    );
  }
}

class _SecondFactorCard extends StatelessWidget {
  const _SecondFactorCard({required this.security});

  final MemberSecuritySnapshot security;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      key: const Key('security-second-factor-card'),
      container: true,
      label:
          'Authentification à deux facteurs. ${security.secondFactorLabel}. ${security.secondFactorDisclosure}',
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
                      Icons.verified_user_outlined,
                      color: CnpmColors.brandBlue,
                    ),
                  ),
                  const SizedBox(width: CnpmSpacing.x2),
                  Expanded(
                    child: Text(
                      'Authentification à deux facteurs',
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
                  label: security.secondFactorLabel,
                  tone: CnpmStatusTone.success,
                ),
              ),
              const SizedBox(height: CnpmSpacing.x3),
              Text(
                security.secondFactorDisclosure,
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

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Semantics(
          header: true,
          child: Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
        const SizedBox(height: CnpmSpacing.x1),
        Text(
          subtitle,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: CnpmColors.textSecondary,
            height: 1.4,
          ),
        ),
      ],
    );
  }
}

class _SecurityMethodCard extends StatelessWidget {
  const _SecurityMethodCard({required this.method});

  final SecurityMethodSnapshot method;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      key: Key('security-method-${method.id}'),
      container: true,
      label:
          '${method.label}. ${method.statusLabel}. ${method.disclosure} Vue consultative.',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(CnpmSpacing.x4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                method.label,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: CnpmStatusBadge(
                  label: method.statusLabel,
                  tone: method.statusLabel == 'Non configurée'
                      ? CnpmStatusTone.neutral
                      : CnpmStatusTone.info,
                ),
              ),
              const SizedBox(height: CnpmSpacing.x3),
              Text(
                method.disclosure,
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

class _SecurityDeviceCard extends StatelessWidget {
  const _SecurityDeviceCard({required this.device});

  final SecurityDeviceSnapshot device;

  @override
  Widget build(BuildContext context) {
    final currentLabel = device.isCurrentSession
        ? 'Session actuelle — démonstration'
        : 'Autre session fictive';
    return Semantics(
      key: Key('security-device-${device.id}'),
      container: true,
      label:
          '${device.label}. ${device.platformLabel}. Dernière activité fictive le ${formatFrenchDate(device.lastActivityAt)}. $currentLabel.',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(CnpmSpacing.x4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const ExcludeSemantics(
                child: Icon(
                  Icons.devices_outlined,
                  color: CnpmColors.brandBlue,
                ),
              ),
              const SizedBox(width: CnpmSpacing.x3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      device.label,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: CnpmSpacing.x1),
                    Text(
                      device.platformLabel,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: CnpmColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: CnpmSpacing.x2),
                    Text(
                      'Dernière activité fictive : ${formatFrenchDate(device.lastActivityAt)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: CnpmColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: CnpmSpacing.x3),
                    CnpmStatusBadge(
                      label: currentLabel,
                      tone: device.isCurrentSession
                          ? CnpmStatusTone.success
                          : CnpmStatusTone.neutral,
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

class _SecurityUnavailableState extends StatelessWidget {
  const _SecurityUnavailableState({required this.reason});

  final String reason;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CnpmSpacing.x6),
        child: Column(
          children: [
            const Icon(
              Icons.security_outlined,
              color: CnpmColors.brandBlue,
              size: CnpmSpacing.x8,
            ),
            const SizedBox(height: CnpmSpacing.x3),
            Semantics(
              header: true,
              child: Text(
                'État de sécurité indisponible',
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
