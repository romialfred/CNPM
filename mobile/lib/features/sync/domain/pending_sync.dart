enum PendingSyncState { queuedLocally }

enum LocalQueueInsertResult { added, duplicateIgnored }

sealed class PendingSyncResult {
  const PendingSyncResult();
}

final class PendingSyncAvailable extends PendingSyncResult {
  const PendingSyncAvailable(this.items);

  final List<PendingSyncMetadata> items;
}

final class PendingSyncEmpty extends PendingSyncResult {
  const PendingSyncEmpty();
}

final class PendingSyncUnavailable extends PendingSyncResult {
  const PendingSyncUnavailable(this.reason);

  final String reason;
}

final class PendingSyncMetadata {
  const PendingSyncMetadata({
    required this.id,
    required this.deduplicationKey,
    required this.label,
    required this.categoryLabel,
    required this.queuedAt,
    required this.state,
    required this.disclosure,
  });

  final String id;
  final String deduplicationKey;
  final String label;
  final String categoryLabel;
  final DateTime queuedAt;
  final PendingSyncState state;
  final String disclosure;
}

final class LocalSyncMetadataQueue {
  final Map<String, PendingSyncMetadata> _itemsByDeduplicationKey = {};

  LocalQueueInsertResult add(PendingSyncMetadata item) {
    if (_itemsByDeduplicationKey.containsKey(item.deduplicationKey)) {
      return LocalQueueInsertResult.duplicateIgnored;
    }
    _itemsByDeduplicationKey[item.deduplicationKey] = item;
    return LocalQueueInsertResult.added;
  }

  List<PendingSyncMetadata> snapshot() {
    final items = _itemsByDeduplicationKey.values.toList()
      ..sort((left, right) => left.queuedAt.compareTo(right.queuedAt));
    return List.unmodifiable(items);
  }
}
