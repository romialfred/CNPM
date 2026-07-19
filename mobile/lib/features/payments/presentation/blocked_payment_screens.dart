import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/app/mobile_app_shell.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_notice.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_status_badge.dart';

/// MOB-006 — préparation visuelle bornée, sans ordre de paiement.
///
/// DEC-002 laisse les opérateurs, contrats et mécanismes de règlement ouverts.
/// L'écran ne collecte donc ni numéro, ni code, ni consentement et n'appelle aucun
/// service externe. Il permet uniquement de valider la composition du parcours.
class BlockedPaymentPreparationScreen extends StatelessWidget {
  const BlockedPaymentPreparationScreen({required this.onSignOut, super.key});

  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Payer une cotisation',
      selectedIndex: 1,
      onSignOut: onSignOut,
      leading: IconButton(
        tooltip: 'Retour aux paiements',
        onPressed: () => context.go('/payments'),
        icon: const Icon(Icons.arrow_back),
      ),
      body: ListView(
        key: const Key('blocked-payment-preparation-list'),
        padding: const EdgeInsets.all(CnpmSpacing.x4),
        children: [
          Semantics(
            header: true,
            child: Text(
              'Préparer un paiement',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: CnpmColors.brandBlueDark,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: CnpmSpacing.x2),
          Text(
            'Vérifiez l’aperçu fictif avant le futur raccordement aux opérateurs Mobile Money.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: CnpmColors.textSecondary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: CnpmSpacing.x4),
          const CnpmNotice(
            message:
                'Démonstration uniquement : aucun numéro Mobile Money n’est demandé, aucune transaction n’est créée et aucun montant n’est encaissé.',
          ),
          const SizedBox(height: CnpmSpacing.x5),
          const _PaymentSummaryCard(),
          const SizedBox(height: CnpmSpacing.x4),
          const _UnavailableOperatorsCard(),
          const SizedBox(height: CnpmSpacing.x4),
          Semantics(
            button: true,
            enabled: false,
            label:
                'Continuer le paiement, indisponible tant que les opérateurs ne sont pas configurés',
            child: const ElevatedButton(
              key: Key('blocked-payment-submit'),
              onPressed: null,
              child: Text('Paiement indisponible'),
            ),
          ),
          const SizedBox(height: CnpmSpacing.x3),
          OutlinedButton.icon(
            key: const Key('open-demo-payment-status'),
            onPressed: () => context.go('/payments/DEMO-PAY-006'),
            icon: const Icon(Icons.timeline_outlined),
            label: const Text('Voir un exemple de suivi'),
          ),
          const SizedBox(height: CnpmSpacing.x3),
          Text(
            'Référence MOB-006 · Décision DEC-002 ouverte',
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: CnpmColors.textMuted),
          ),
        ],
      ),
    );
  }
}

class _PaymentSummaryCard extends StatelessWidget {
  const _PaymentSummaryCard();

  @override
  Widget build(BuildContext context) {
    return Card(
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
                  'Appel fictif 2026',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const CnpmStatusBadge(
                  label: 'Simulation',
                  tone: CnpmStatusTone.info,
                ),
              ],
            ),
            const SizedBox(height: CnpmSpacing.x4),
            Text(
              '350 000 FCFA',
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: CnpmSpacing.x1),
            Text(
              'Montant de démonstration, sans valeur comptable',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: CnpmColors.textSecondary),
            ),
            const SizedBox(height: CnpmSpacing.x4),
            const Divider(height: 1),
            const SizedBox(height: CnpmSpacing.x3),
            const _IconLine(
              icon: Icons.business_outlined,
              text: 'Entreprise Démo Sahel',
            ),
            const SizedBox(height: CnpmSpacing.x2),
            const _IconLine(
              icon: Icons.tag_outlined,
              text: 'DEMO-COT-2026-001',
            ),
          ],
        ),
      ),
    );
  }
}

class _UnavailableOperatorsCard extends StatelessWidget {
  const _UnavailableOperatorsCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CnpmSpacing.x4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Mode de paiement',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: CnpmSpacing.x2),
            Text(
              'Les opérateurs seront affichés ici après contractualisation et validation de leur environnement de test.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: CnpmColors.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: CnpmSpacing.x4),
            const _IconLine(
              icon: Icons.lock_outline,
              text: 'Aucun opérateur configuré',
            ),
            const SizedBox(height: CnpmSpacing.x2),
            const _IconLine(
              icon: Icons.phone_android_outlined,
              text: 'Aucun numéro collecté',
            ),
          ],
        ),
      ),
    );
  }
}

/// MOB-007 — exemple local d'un état non transmis, jamais une confirmation.
class BlockedPaymentStatusScreen extends StatelessWidget {
  const BlockedPaymentStatusScreen({
    required this.paymentId,
    required this.onSignOut,
    super.key,
  });

  final String paymentId;
  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    final isKnownDemo = paymentId == 'DEMO-PAY-006';
    return MobileAppShell(
      title: 'État du paiement',
      selectedIndex: 1,
      onSignOut: onSignOut,
      leading: IconButton(
        tooltip: 'Retour aux paiements',
        onPressed: () => context.go('/payments'),
        icon: const Icon(Icons.arrow_back),
      ),
      body: ListView(
        key: const Key('blocked-payment-status-list'),
        padding: const EdgeInsets.all(CnpmSpacing.x4),
        children: [
          if (!isKnownDemo)
            _UnknownPaymentState(paymentId: paymentId)
          else ...[
            Semantics(
              header: true,
              child: Text(
                'Suivi de démonstration',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: CnpmColors.brandBlueDark,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(height: CnpmSpacing.x2),
            Text(
              'Référence $paymentId',
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(color: CnpmColors.textSecondary),
            ),
            const SizedBox(height: CnpmSpacing.x4),
            const CnpmNotice(
              message:
                  'Cet exemple n’est pas une preuve de paiement. Aucune confirmation CNPM ni reçu officiel ne peut être émis.',
            ),
            const SizedBox(height: CnpmSpacing.x5),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(CnpmSpacing.x4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const CnpmStatusBadge(
                      label: 'Non transmis',
                      tone: CnpmStatusTone.warning,
                    ),
                    const SizedBox(height: CnpmSpacing.x5),
                    const _TimelineStep(
                      icon: Icons.description_outlined,
                      title: 'Demande préparée',
                      detail: 'Aperçu fictif affiché localement.',
                      active: true,
                    ),
                    const _TimelineStep(
                      icon: Icons.send_outlined,
                      title: 'Transmission à l’opérateur',
                      detail: 'Indisponible tant que DEC-002 reste ouverte.',
                    ),
                    const _TimelineStep(
                      icon: Icons.verified_outlined,
                      title: 'Confirmation CNPM',
                      detail:
                          'Impossible sans transaction rapprochée et validée.',
                      isLast: true,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: CnpmSpacing.x4),
            OutlinedButton(
              onPressed: () => context.go('/payments'),
              child: const Text('Retour à mes paiements'),
            ),
            const SizedBox(height: CnpmSpacing.x3),
            Text(
              'Référence MOB-007 · Décision DEC-002 ouverte',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: CnpmColors.textMuted),
            ),
          ],
        ],
      ),
    );
  }
}

class _UnknownPaymentState extends StatelessWidget {
  const _UnknownPaymentState({required this.paymentId});

  final String paymentId;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CnpmSpacing.x5),
        child: Column(
          children: [
            const Icon(
              Icons.search_off_outlined,
              size: 40,
              color: CnpmColors.textMuted,
            ),
            const SizedBox(height: CnpmSpacing.x3),
            Text(
              'Paiement introuvable',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: CnpmSpacing.x2),
            Text(
              'Aucun état de démonstration ne correspond à cette référence.',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: CnpmColors.textSecondary),
            ),
            const SizedBox(height: CnpmSpacing.x4),
            OutlinedButton(
              onPressed: () => context.go('/payments'),
              child: const Text('Retour aux paiements'),
            ),
          ],
        ),
      ),
    );
  }
}

class _TimelineStep extends StatelessWidget {
  const _TimelineStep({
    required this.icon,
    required this.title,
    required this.detail,
    this.active = false,
    this.isLast = false,
  });

  final IconData icon;
  final String title;
  final String detail;
  final bool active;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: CnpmSpacing.x8,
            child: Column(
              children: [
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: active
                        ? CnpmColors.brandBlue50
                        : CnpmColors.surfaceSubtle,
                    shape: BoxShape.circle,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(CnpmSpacing.x2),
                    child: Icon(
                      icon,
                      size: 18,
                      color: active
                          ? CnpmColors.brandBlue
                          : CnpmColors.textMuted,
                    ),
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(width: 2, color: CnpmColors.borderSubtle),
                  ),
              ],
            ),
          ),
          const SizedBox(width: CnpmSpacing.x3),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: CnpmSpacing.x5),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: CnpmSpacing.x1),
                  Text(
                    detail,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: CnpmColors.textSecondary,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _IconLine extends StatelessWidget {
  const _IconLine({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: CnpmSpacing.x5, color: CnpmColors.textMuted),
        const SizedBox(width: CnpmSpacing.x2),
        Expanded(
          child: Text(
            text,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: CnpmColors.textSecondary),
          ),
        ),
      ],
    );
  }
}
