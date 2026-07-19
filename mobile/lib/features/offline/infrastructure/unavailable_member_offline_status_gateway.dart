import 'package:cnpm_mobile/features/offline/domain/member_offline_status.dart';
import 'package:cnpm_mobile/features/offline/domain/member_offline_status_gateway.dart';

final class UnavailableMemberOfflineStatusGateway
    implements MemberOfflineStatusGateway {
  const UnavailableMemberOfflineStatusGateway();

  @override
  Future<MemberOfflineStatusResult> loadStatus() async {
    return const MemberOfflineStatusUnavailable(
      'Aucun contrat typé ni adaptateur de connectivité validé ne permet d’exposer un état réel. Le mode normal reste fermé par défaut.',
    );
  }
}
