import 'package:cnpm_mobile/features/offline/domain/member_offline_status.dart';

abstract interface class MemberOfflineStatusGateway {
  Future<MemberOfflineStatusResult> loadStatus();
}
