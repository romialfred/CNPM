import 'package:cnpm_mobile/features/offline/domain/member_offline_status.dart';
import 'package:cnpm_mobile/features/offline/domain/member_offline_status_gateway.dart';

final class LoadMemberOfflineStatus {
  const LoadMemberOfflineStatus(this._gateway);

  final MemberOfflineStatusGateway _gateway;

  Future<MemberOfflineStatusResult> call() => _gateway.loadStatus();
}
