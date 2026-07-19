import 'package:cnpm_mobile/features/sync/domain/pending_sync.dart';
import 'package:cnpm_mobile/features/sync/domain/pending_sync_gateway.dart';

final class DemoPendingSyncGateway implements PendingSyncGateway {
  const DemoPendingSyncGateway();

  @override
  Future<PendingSyncResult> loadPendingItems() async {
    final queue = LocalSyncMetadataQueue();
    final draftMetadata = PendingSyncMetadata(
      id: 'demo-sync-metadata-0001',
      deduplicationKey: 'demo-dedup-draft-0001',
      label: 'Métadonnée de brouillon fictif',
      categoryLabel: 'Référence locale uniquement',
      queuedAt: DateTime.utc(2026, 7, 19, 8, 50),
      state: PendingSyncState.queuedLocally,
      disclosure:
          'Aucun message, document, contact ou contenu métier n’est conservé.',
    );
    queue
      ..add(draftMetadata)
      ..add(
        PendingSyncMetadata(
          id: 'demo-sync-metadata-0002',
          deduplicationKey: 'demo-dedup-display-0001',
          label: 'Préférence d’affichage fictive',
          categoryLabel: 'Interface de démonstration',
          queuedAt: DateTime.utc(2026, 7, 19, 8, 52),
          state: PendingSyncState.queuedLocally,
          disclosure:
              'Métadonnée non sensible, sans identité, coordonnées ou valeur financière.',
        ),
      )
      // Le rejeu de la même intention est volontairement neutralisé.
      ..add(draftMetadata);

    return PendingSyncAvailable(queue.snapshot());
  }
}
