import 'package:cnpm_mobile/features/sync/domain/pending_sync.dart';
import 'package:cnpm_mobile/features/sync/domain/pending_sync_gateway.dart';

final class LoadPendingSync {
  const LoadPendingSync(this._gateway);

  final PendingSyncGateway _gateway;

  Future<PendingSyncResult> call() => _gateway.loadPendingItems();
}
