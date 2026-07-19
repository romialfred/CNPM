import 'package:cnpm_mobile/features/sync/domain/pending_sync.dart';
import 'package:cnpm_mobile/features/sync/domain/pending_sync_gateway.dart';

final class UnavailablePendingSyncGateway implements PendingSyncGateway {
  const UnavailablePendingSyncGateway();

  @override
  Future<PendingSyncResult> loadPendingItems() async {
    return const PendingSyncUnavailable(
      'Aucun contrat typé de synchronisation n’est disponible. Aucune file générique n’est interprétée et aucun envoi réseau n’est tenté.',
    );
  }
}
