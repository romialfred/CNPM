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
import 'package:cnpm_mobile/features/receipts/application/load_member_receipt.dart';
import 'package:cnpm_mobile/features/receipts/domain/member_receipt.dart';
import 'package:cnpm_mobile/features/receipts/presentation/receipt_list_screen.dart';

class ReceiptDetailScreen extends StatefulWidget {
  const ReceiptDetailScreen({
    required this.receiptId,
    required this.loadReceipt,
    required this.isDemo,
    required this.onSignOut,
    super.key,
  });

  final String receiptId;
  final LoadMemberReceipt loadReceipt;
  final bool isDemo;
  final VoidCallback onSignOut;

  @override
  State<ReceiptDetailScreen> createState() => _ReceiptDetailScreenState();
}

class _ReceiptDetailScreenState extends State<ReceiptDetailScreen> {
  late final ContentController<MemberReceiptLookup> _controller;

  @override
  void initState() {
    super.initState();
    _controller = ContentController<MemberReceiptLookup>(
      load: () => widget.loadReceipt(widget.receiptId),
      isEmpty: (lookup) => false,
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
      title: 'Aperçu du reçu',
      selectedIndex: 2,
      onSignOut: widget.onSignOut,
      leading: IconButton(
        tooltip: 'Retour à la liste des reçus',
        onPressed: () => context.go('/receipts'),
        icon: const Icon(Icons.arrow_back),
      ),
      body: ListenableBuilder(
        listenable: _controller,
        builder: (context, child) {
          return ListView(
            key: const Key('receipt-detail'),
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            children: [
              Semantics(
                header: true,
                child: Text(
                  'Aperçu détaillé',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Text(
                'Résumé textuel en lecture seule. Le document officiel reste une preuve distincte, produite côté serveur.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: CnpmColors.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: CnpmSpacing.x5),
              switch (_controller.phase) {
                ContentPhase.idle ||
                ContentPhase.loading => const CnpmLoadingState(
                  label: 'Chargement de l’aperçu du reçu',
                ),
                ContentPhase.failure => CnpmErrorState(
                  onRetry: _controller.reload,
                  title: 'Erreur de chargement de l’aperçu',
                  message:
                      'L’aperçu n’a pas pu être chargé. Réessayez sans relancer aucune opération financière.',
                ),
                ContentPhase.empty => const CnpmEmptyState(
                  title: 'Aperçu introuvable',
                  message:
                      'Aucun aperçu n’est disponible pour cette référence.',
                  icon: Icons.find_in_page_outlined,
                ),
                ContentPhase.ready => _ReceiptLookupContent(
                  lookup: _controller.value!,
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

class _ReceiptLookupContent extends StatelessWidget {
  const _ReceiptLookupContent({required this.lookup, required this.isDemo});

  final MemberReceiptLookup lookup;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    final currentLookup = lookup;
    if (currentLookup is MemberReceiptFound) {
      return _ReceiptPreviewContent(
        receipt: currentLookup.receipt,
        isDemo: isDemo,
      );
    }
    if (currentLookup is MemberReceiptUnavailable) {
      return _DetailUnavailableState(reason: currentLookup.reason);
    }
    return const _NotFoundState();
  }
}

class _ReceiptPreviewContent extends StatelessWidget {
  const _ReceiptPreviewContent({required this.receipt, required this.isDemo});

  final MemberReceipt receipt;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    final (statusLabel, statusTone) = receiptStatusView(receipt.status);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (isDemo) ...[
          const CnpmNotice(
            message:
                'Aperçu entièrement fictif et sans valeur probante. Il ne confirme aucun paiement et ne constitue pas un document CNPM.',
          ),
          const SizedBox(height: CnpmSpacing.x4),
        ],
        Semantics(
          container: true,
          label:
              'Résumé de l’aperçu fictif ${receipt.reference}. Statut $statusLabel. ${receipt.periodLabel}. Montant du scénario ${formatXof(receipt.amountXof)}. Date du scénario ${formatFrenchDate(receipt.scenarioDate)}. Aucune valeur probante.',
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(CnpmSpacing.x5),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'APERÇU DE DÉMONSTRATION',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: CnpmColors.brandBlue,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.6,
                    ),
                  ),
                  const SizedBox(height: CnpmSpacing.x3),
                  Text(
                    receipt.reference,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: CnpmColors.brandBlueDark,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: CnpmSpacing.x3),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: CnpmStatusBadge(
                      label: statusLabel,
                      tone: statusTone,
                    ),
                  ),
                  const Divider(height: CnpmSpacing.x8),
                  _DefinitionRow(
                    label: 'Période du scénario',
                    value: receipt.periodLabel,
                  ),
                  const SizedBox(height: CnpmSpacing.x4),
                  _DefinitionRow(
                    label: 'Montant du scénario',
                    value: formatXof(receipt.amountXof),
                  ),
                  const SizedBox(height: CnpmSpacing.x4),
                  _DefinitionRow(
                    label: 'Date du scénario',
                    value: formatFrenchDate(receipt.scenarioDate),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: CnpmSpacing.x6),
        const _SectionTitle(title: 'Provenance démonstrative'),
        const SizedBox(height: CnpmSpacing.x3),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _Disclosure(
                  icon: Icons.science_outlined,
                  title: 'Source fictive',
                  message: receipt.sourceDisclosure,
                ),
                const Divider(height: CnpmSpacing.x6),
                _Disclosure(
                  icon: Icons.account_balance_wallet_outlined,
                  title: 'Paiement non reproduit',
                  message: receipt.paymentDisclosure,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: CnpmSpacing.x6),
        const _SectionTitle(title: 'Preuve officielle'),
        const SizedBox(height: CnpmSpacing.x3),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            child: _Disclosure(
              icon: Icons.file_download_off_outlined,
              title: 'Téléchargement et partage indisponibles',
              message: receipt.proofDisclosure,
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
  const _DefinitionRow({required this.label, required this.value});

  final String label;
  final String value;

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
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
      ],
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
    return _StateCard(
      icon: Icons.find_in_page_outlined,
      title: 'Aperçu introuvable',
      message: 'Cette référence n’est pas disponible pour la session membre.',
      action: OutlinedButton.icon(
        onPressed: () => context.go('/receipts'),
        icon: const Icon(Icons.arrow_back),
        label: const Text('Retour aux reçus'),
      ),
    );
  }
}

class _DetailUnavailableState extends StatelessWidget {
  const _DetailUnavailableState({required this.reason});

  final String reason;

  @override
  Widget build(BuildContext context) {
    return _StateCard(
      icon: Icons.file_download_off_outlined,
      title: 'Service de reçus indisponible',
      message: reason,
      action: OutlinedButton.icon(
        onPressed: () => context.go('/receipts'),
        icon: const Icon(Icons.arrow_back),
        label: const Text('Retour aux reçus'),
      ),
    );
  }
}

class _StateCard extends StatelessWidget {
  const _StateCard({
    required this.icon,
    required this.title,
    required this.message,
    required this.action,
  });

  final IconData icon;
  final String title;
  final String message;
  final Widget action;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CnpmSpacing.x6),
        child: Column(
          children: [
            Icon(icon, color: CnpmColors.brandBlue, size: CnpmSpacing.x8),
            const SizedBox(height: CnpmSpacing.x3),
            Semantics(
              header: true,
              child: Text(
                title,
                textAlign: TextAlign.center,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            const SizedBox(height: CnpmSpacing.x2),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: CnpmColors.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: CnpmSpacing.x4),
            action,
          ],
        ),
      ),
    );
  }
}
