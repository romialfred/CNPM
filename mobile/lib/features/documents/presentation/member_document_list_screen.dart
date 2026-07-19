import 'package:flutter/material.dart';

import 'package:cnpm_mobile/app/mobile_app_shell.dart';
import 'package:cnpm_mobile/core/presentation/cnpm_formatters.dart';
import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_content_state.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_notice.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_status_badge.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_sync_status.dart';
import 'package:cnpm_mobile/features/documents/domain/member_document.dart';

class MemberDocumentListScreen extends StatefulWidget {
  const MemberDocumentListScreen({
    required this.controller,
    required this.isDemo,
    required this.onSignOut,
    super.key,
  });

  final ContentController<MemberDocumentCollection> controller;
  final bool isDemo;
  final VoidCallback onSignOut;

  @override
  State<MemberDocumentListScreen> createState() =>
      _MemberDocumentListScreenState();
}

class _MemberDocumentListScreenState extends State<MemberDocumentListScreen> {
  @override
  void initState() {
    super.initState();
    widget.controller.ensureLoaded();
  }

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Mes documents',
      selectedIndex: 4,
      onSignOut: widget.onSignOut,
      body: ListenableBuilder(
        listenable: widget.controller,
        builder: (context, child) {
          return ListView(
            key: const Key('member-document-list'),
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            children: [
              Semantics(
                header: true,
                child: Text(
                  'Catalogue documentaire',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Text(
                'Consultez les métadonnées disponibles pour votre scénario membre.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: CnpmColors.textSecondary,
                  height: 1.4,
                ),
              ),
              if (widget.isDemo) ...[
                const SizedBox(height: CnpmSpacing.x4),
                const CnpmNotice(
                  message:
                      'Catalogue local fictif : aucun fichier, PDF, lien de téléchargement, QR, signature ou cachet n’est fourni.',
                ),
              ],
              const SizedBox(height: CnpmSpacing.x5),
              switch (widget.controller.phase) {
                ContentPhase.idle ||
                ContentPhase.loading => const CnpmLoadingState(
                  label: 'Chargement du catalogue documentaire',
                ),
                ContentPhase.failure => CnpmErrorState(
                  onRetry: widget.controller.reload,
                  title: 'Erreur de chargement des documents',
                  message:
                      'Le catalogue n’a pas pu être chargé. Réessayez sans déclencher de téléchargement.',
                ),
                ContentPhase.empty => const CnpmEmptyState(
                  title: 'Aucun document',
                  message:
                      'Aucune métadonnée documentaire n’est disponible pour cette session.',
                  icon: Icons.folder_open_outlined,
                ),
                ContentPhase.ready => _DocumentCollectionContent(
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

class _DocumentCollectionContent extends StatelessWidget {
  const _DocumentCollectionContent({
    required this.collection,
    required this.isDemo,
  });

  final MemberDocumentCollection collection;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    final current = collection;
    if (current is MemberDocumentsUnavailable) {
      return _DocumentUnavailableState(reason: current.reason);
    }

    final documents = (current as MemberDocumentsAvailable).documents;
    if (documents.isEmpty) {
      return const CnpmEmptyState(
        title: 'Aucun document',
        message:
            'Aucune métadonnée documentaire n’est disponible pour cette session.',
        icon: Icons.folder_open_outlined,
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          documents.length == 1
              ? '1 métadonnée fictive'
              : '${documents.length} métadonnées fictives',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: CnpmSpacing.x3),
        for (var index = 0; index < documents.length; index++) ...[
          _DocumentCard(document: documents[index]),
          if (index != documents.length - 1)
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

class _DocumentCard extends StatelessWidget {
  const _DocumentCard({required this.document});

  final MemberDocument document;

  @override
  Widget build(BuildContext context) {
    final (statusLabel, statusTone) = _documentStatusView(document.status);
    return Semantics(
      key: Key('document-${document.id}'),
      container: true,
      label:
          '${document.reference}, ${document.title}, ${document.categoryLabel}, ${document.versionLabel}, métadonnée enregistrée le ${formatFrenchDate(document.metadataRecordedOn)}, statut $statusLabel. ${document.availabilityDisclosure}',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(CnpmSpacing.x4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Wrap(
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: CnpmSpacing.x3,
                runSpacing: CnpmSpacing.x2,
                children: [
                  Text(
                    document.reference,
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
                document.title,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: CnpmSpacing.x3),
              _MetadataRow(
                icon: Icons.category_outlined,
                value: document.categoryLabel,
              ),
              const SizedBox(height: CnpmSpacing.x2),
              _MetadataRow(
                icon: Icons.layers_outlined,
                value: document.versionLabel,
              ),
              const SizedBox(height: CnpmSpacing.x2),
              _MetadataRow(
                icon: Icons.calendar_today_outlined,
                value:
                    'Métadonnée enregistrée le ${formatFrenchDate(document.metadataRecordedOn)}',
              ),
              const Divider(height: CnpmSpacing.x6),
              Text(
                document.availabilityDisclosure,
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

class _MetadataRow extends StatelessWidget {
  const _MetadataRow({required this.icon, required this.value});

  final IconData icon;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: CnpmColors.textMuted, size: CnpmSpacing.x5),
        const SizedBox(width: CnpmSpacing.x2),
        Expanded(
          child: Text(
            value,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: CnpmColors.textSecondary),
          ),
        ),
      ],
    );
  }
}

class _DocumentUnavailableState extends StatelessWidget {
  const _DocumentUnavailableState({required this.reason});

  final String reason;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CnpmSpacing.x6),
        child: Column(
          children: [
            const Icon(
              Icons.folder_off_outlined,
              color: CnpmColors.brandBlue,
              size: CnpmSpacing.x8,
            ),
            const SizedBox(height: CnpmSpacing.x3),
            Semantics(
              header: true,
              child: Text(
                'Catalogue documentaire indisponible',
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

(String, CnpmStatusTone) _documentStatusView(MemberDocumentStatus status) {
  return switch (status) {
    MemberDocumentStatus.catalogued => (
      'Répertorié — démonstration',
      CnpmStatusTone.info,
    ),
    MemberDocumentStatus.processing => (
      'Traitement fictif',
      CnpmStatusTone.warning,
    ),
    MemberDocumentStatus.expired => (
      'Expiré — scénario',
      CnpmStatusTone.neutral,
    ),
  };
}
