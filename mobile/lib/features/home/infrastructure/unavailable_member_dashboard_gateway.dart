import 'package:cnpm_mobile/core/domain/member_content_failure.dart';
import 'package:cnpm_mobile/features/home/domain/member_dashboard.dart';
import 'package:cnpm_mobile/features/home/domain/member_dashboard_gateway.dart';

final class UnavailableMemberDashboardGateway
    implements MemberDashboardGateway {
  const UnavailableMemberDashboardGateway();

  @override
  Future<MemberDashboard> loadDashboard() {
    throw const MemberContentFailure(MemberContentFailureKind.unavailable);
  }
}
