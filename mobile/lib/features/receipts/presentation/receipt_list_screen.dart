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
import 'package:cnpm_mobile/features/receipts/domain/member_receipt.dart';

class ReceiptListScreen extends StatefulWidget {
  const ReceiptListScreen({
    required this.controller,
    required this.isDemo,
    required this.onSignOut,
    super.key,
  });

  final ContentController<MemberReceiptCollection> controller;
  final bool isDemo;
  final VoidCallback onSignOut;

  @override
  State<ReceiptListScreen> createState() => _ReceiptListScreenState();
}

class _ReceiptListScreenState extends State<ReceiptListScreen> {
  @override
  void initState() {
    super.initState();
    widget.controller.ensureLoaded();
  }

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Mes reçus',
      selectedIndex: 2,
      onSignOut: widget.onSignOut,
      body: ListenableBuilder(
        listenable: widget.controller,
        builder: (context, child) {
          return ListView(
            key: const Key('receipt-list'),
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            children: [
              Semantics(
                header: true,
                child: Text(
                  'Liste des reçus',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Text(
                'Consultez les aperçus disponibles pour votre session. Aucune preuve officielle n’est fabriquée par l’application mobile.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: CnpmColors.textSecondary,
                  height: 1.4,
                ),
              ),
              if (widget.isDemo) ...[
                const SizedBox(height: CnpmSpacing.x4),
                const CnpmNotice(
                  message:
                      'Scénario local entièrement fictif : aucun élément affiché n’est un reçu officiel, une preuve de paiement ou une donnée CNPM.',
                ),
              ],
              const SizedBox(height: CnpmSpacing.x5),
              switch (widget.controller.phase) {
                ContentPhase.idle ||
                ContentPhase.loading => const CnpmLoadingState(
                  label: 'Chargement de la liste des reçus',
                ),
                ContentPhase.failure => CnpmErrorState(
                  onRetry: widget.controller.reload,
                  title: 'Erreur de chargement des reçus',
                  message:
                      'La liste n’a pas pu être chargée. Réessayez sans relancer aucune opération financière.',
                ),
                ContentPhase.empty => const CnpmEmptyState(
                  title: 'Aucun reçu',
                  message:
                      'Aucun aperçu de reçu n’est disponible pour cette session.',
                  icon: Icons.receipt_long_outlined,
                ),
                ContentPhase.ready => _ReceiptCollectionContent(
                  collection: widget.controller.value!,
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

class _ReceiptCollectionContent extends StatelessWidget {
  const _ReceiptCollectionContent({
    required this.collection,
    required this.isDemo,
  });

  final MemberReceiptCollection collection;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    final currentCollection = collection;
    if (currentCollection is MemberReceiptsUnavailable) {
      return _UnavailableState(reason: currentCollection.reason);
    }

    final receipts = (currentCollection as MemberReceiptsAvailable).receipts;
    if (receipts.isEmpty) {
      return const CnpmEmptyState(
        title: 'Aucun reçu',
        message: 'Aucun aperçu de reçu n’est disponible pour cette session.',
        icon: Icons.receipt_long_outlined,
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          receipts.length == 1
              ? '1 aperçu fictif'
              : '${receipts.length} aperçus fictifs',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: CnpmSpacing.x3),
        for (var index = 0; index < receipts.length; index++) ...[
          _ReceiptCard(receipt: receipts[index]),
          if (index != receipts.length - 1)
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

class _ReceiptCard extends StatelessWidget {
  const _ReceiptCard({required this.receipt});

  final MemberReceipt receipt;

  @override
  Widget build(BuildContext context) {
    final (statusLabel, statusTone) = receiptStatusView(receipt.status);

    return Semantics(
      button: true,
      container: true,
      excludeSemantics: true,
      label:
          'Aperçu fictif ${receipt.reference}, ${receipt.periodLabel}, statut $statusLabel, montant du scénario ${formatXof(receipt.amountXof)}, date du scénario ${formatFrenchDate(receipt.scenarioDate)}. Aucune valeur probante. Ouvrir l’aperçu.',
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          key: Key('receipt-${receipt.id}'),
          onTap: () => context.go('/receipts/${receipt.id}'),
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
                      receipt.reference,
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
                  receipt.periodLabel,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: CnpmSpacing.x3),
                Text(
                  'Montant du scénario : ${formatXof(receipt.amountXof)}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: CnpmColors.textSecondary,
                  ),
                ),
                const SizedBox(height: CnpmSpacing.x2),
                Text(
                  'Date du scénario : ${formatFrenchDate(receipt.scenarioDate)}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: CnpmColors.textSecondary,
                  ),
                ),
                const SizedBox(height: CnpmSpacing.x4),
                ExcludeSemantics(
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Voir l’aperçu',
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

class _UnavailableState extends StatelessWidget {
  const _UnavailableState({required this.reason});

  final String reason;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CnpmSpacing.x6),
        child: Column(
          children: [
            const Icon(
              Icons.file_download_off_outlined,
              color: CnpmColors.brandBlue,
              size: CnpmSpacing.x8,
            ),
            const SizedBox(height: CnpmSpacing.x3),
            Semantics(
              header: true,
              child: Text(
                'Service de reçus indisponible',
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

(String, CnpmStatusTone) receiptStatusView(MemberReceiptStatus status) {
  return switch (status) {
    MemberReceiptStatus.demonstrationAvailable => (
      'Aperçu disponible — démonstration',
      CnpmStatusTone.info,
    ),
    MemberReceiptStatus.demonstrationCancelled => (
      'Aperçu annulé — démonstration',
      CnpmStatusTone.warning,
    ),
  };
}
