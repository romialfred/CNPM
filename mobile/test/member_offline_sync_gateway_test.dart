import 'package:flutter_test/flutter_test.dart';

import 'package:cnpm_mobile/features/offline/domain/member_offline_status.dart';
import 'package:cnpm_mobile/features/offline/infrastructure/demo_member_offline_status_gateway.dart';
import 'package:cnpm_mobile/features/offline/infrastructure/unavailable_member_offline_status_gateway.dart';
import 'package:cnpm_mobile/features/sync/domain/pending_sync.dart';
import 'package:cnpm_mobile/features/sync/infrastructure/demo_pending_sync_gateway.dart';
import 'package:cnpm_mobile/features/sync/infrastructure/unavailable_pending_sync_gateway.dart';

void main() {
  test('MOB-018 expose seulement un état de connectivité fictif', () async {
    final result = await const DemoMemberOfflineStatusGateway().loadStatus();

    expect(result, isA<MemberOfflineStatusAvailable>());
    final status = (result as MemberOfflineStatusAvailable).status;
    expect(status.modeLabel, contains('scénario fictif'));
    expect(status.capabilities, hasLength(4));
    expect(
      status.capabilities.every((item) => item.id.startsWith('demo-offline-')),
      isTrue,
    );
    expect(
      status.capabilities
          .where(
            (item) =>
                item.availability == OfflineCapabilityAvailability.blocked,
          )
          .map((item) => item.label),
      containsAll([
        'Paiements, reçus et validations',
        'Documents et pièces KYC',
      ]),
    );
  });

  test('la file locale ignore un rejeu portant la même clé', () {
    final queue = LocalSyncMetadataQueue();
    final original = PendingSyncMetadata(
      id: 'demo-sync-original',
      deduplicationKey: 'demo-dedup-unique',
      label: 'Métadonnée fictive',
      categoryLabel: 'Test local',
      queuedAt: DateTime.utc(2026, 7, 19, 9),
      state: PendingSyncState.queuedLocally,
      disclosure: 'Aucun contenu sensible.',
    );
    final replay = PendingSyncMetadata(
      id: 'demo-sync-replay',
      deduplicationKey: 'demo-dedup-unique',
      label: 'Rejeu fictif',
      categoryLabel: 'Test local',
      queuedAt: DateTime.utc(2026, 7, 19, 9, 1),
      state: PendingSyncState.queuedLocally,
      disclosure: 'Aucun contenu sensible.',
    );

    expect(queue.add(original), LocalQueueInsertResult.added);
    expect(queue.add(replay), LocalQueueInsertResult.duplicateIgnored);
    expect(queue.snapshot(), hasLength(1));
    expect(queue.snapshot().single.id, original.id);
  });

  test('MOB-019 retourne une file dédupliquée et non sensible', () async {
    final result = await const DemoPendingSyncGateway().loadPendingItems();

    expect(result, isA<PendingSyncAvailable>());
    final items = (result as PendingSyncAvailable).items;
    expect(items, hasLength(2));
    expect(items.map((item) => item.deduplicationKey).toSet(), hasLength(2));
    expect(items.every((item) => item.id.startsWith('demo-sync-')), isTrue);

    final projection = items
        .expand((item) => [item.label, item.categoryLabel, item.disclosure])
        .join(' ');
    expect(projection, isNot(contains('@')));
    expect(projection, isNot(contains('FCFA')));
    expect(projection.toLowerCase(), isNot(contains('jeton')));
    expect(projection.toLowerCase(), isNot(contains('secret')));
  });

  test('MOB-018/019 restent fermés sans adaptateurs validés', () async {
    final offline = await const UnavailableMemberOfflineStatusGateway()
        .loadStatus();
    final sync = await const UnavailablePendingSyncGateway().loadPendingItems();

    expect(offline, isA<MemberOfflineStatusUnavailable>());
    expect(sync, isA<PendingSyncUnavailable>());
  });
}
