import 'package:flutter/material.dart';

import 'package:cnpm_mobile/app/mobile_app_shell.dart';
import 'package:cnpm_mobile/core/presentation/cnpm_formatters.dart';
import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_content_state.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_notice.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_status_badge.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_sync_status.dart';
import 'package:cnpm_mobile/features/payments/domain/member_payment.dart';

class PaymentHistoryScreen extends StatefulWidget {
  const PaymentHistoryScreen({
    required this.controller,
    required this.isDemo,
    required this.onSignOut,
    super.key,
  });

  final ContentController<List<MemberPayment>> controller;
  final bool isDemo;
  final VoidCallback onSignOut;

  @override
  State<PaymentHistoryScreen> createState() => _PaymentHistoryScreenState();
}

class _PaymentHistoryScreenState extends State<PaymentHistoryScreen> {
  @override
  void initState() {
    super.initState();
    widget.controller.ensureLoaded();
  }

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Mes paiements',
      selectedIndex: 1,
      onSignOut: widget.onSignOut,
      body: ListenableBuilder(
        listenable: widget.controller,
        builder: (context, child) {
          return ListView(
            key: const Key('payment-history-list'),
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            children: [
              Semantics(
                header: true,
                child: Text(
                  'Historique des paiements',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Text(
                'Consultez les opérations déclarées et leur dernier statut disponible.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: CnpmColors.textSecondary,
                  height: 1.4,
                ),
              ),
              if (widget.isDemo) ...[
                const SizedBox(height: CnpmSpacing.x4),
                const CnpmNotice(
                  message:
                      'Lecture de démonstration uniquement : aucun paiement affiché n’est confirmé ni encaissé par le CNPM.',
                ),
              ],
              const SizedBox(height: CnpmSpacing.x5),
              switch (widget.controller.phase) {
                ContentPhase.idle ||
                ContentPhase.loading => const CnpmLoadingState(
                  label: 'Chargement de l’historique des paiements',
                ),
                ContentPhase.failure => CnpmErrorState(
                  onRetry: widget.controller.reload,
                ),
                ContentPhase.empty => const CnpmEmptyState(
                  title: 'Aucun paiement',
                  message:
                      'Aucune opération n’est disponible dans votre historique.',
                  icon: Icons.account_balance_wallet_outlined,
                ),
                ContentPhase.ready => _PaymentList(
                  payments: widget.controller.value!,
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

class _PaymentList extends StatelessWidget {
  const _PaymentList({required this.payments, required this.isDemo});

  final List<MemberPayment> payments;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '${payments.length} opérations à suivre',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: CnpmSpacing.x3),
        for (var index = 0; index < payments.length; index++) ...[
          _PaymentCard(payment: payments[index]),
          if (index != payments.length - 1)
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

class _PaymentCard extends StatelessWidget {
  const _PaymentCard({required this.payment});

  final MemberPayment payment;

  @override
  Widget build(BuildContext context) {
    final (statusLabel, tone) = switch (payment.status) {
      MemberPaymentStatus.processing => ('En traitement', CnpmStatusTone.info),
      MemberPaymentStatus.needsReview => ('À vérifier', CnpmStatusTone.warning),
    };

    return Semantics(
      container: true,
      label:
          '${payment.reference}, montant déclaré ${formatXof(payment.amountXof)}, $statusLabel',
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
                    payment.reference,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: CnpmColors.brandBlue,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  CnpmStatusBadge(label: statusLabel, tone: tone),
                ],
              ),
              const SizedBox(height: CnpmSpacing.x4),
              Text(
                formatXof(payment.amountXof),
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: CnpmSpacing.x1),
              Text(
                'Montant déclaré',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: CnpmColors.textSecondary,
                ),
              ),
              const SizedBox(height: CnpmSpacing.x4),
              const Divider(height: 1),
              const SizedBox(height: CnpmSpacing.x3),
              _PaymentDetail(
                icon: Icons.calendar_today_outlined,
                label: 'Déclaré le ${formatFrenchDate(payment.submittedOn)}',
              ),
              const SizedBox(height: CnpmSpacing.x2),
              _PaymentDetail(
                icon: Icons.account_balance_outlined,
                label: payment.channelLabel,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PaymentDetail extends StatelessWidget {
  const _PaymentDetail({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: CnpmSpacing.x5, color: CnpmColors.textMuted),
        const SizedBox(width: CnpmSpacing.x2),
        Expanded(
          child: Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: CnpmColors.textSecondary),
          ),
        ),
      ],
    );
  }
}
