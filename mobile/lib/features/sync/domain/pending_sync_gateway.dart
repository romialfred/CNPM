import 'package:cnpm_mobile/features/sync/domain/pending_sync.dart';

abstract interface class PendingSyncGateway {
  Future<PendingSyncResult> loadPendingItems();
}
