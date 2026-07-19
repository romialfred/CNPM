import 'package:cnpm_mobile/features/home/domain/member_dashboard.dart';
import 'package:cnpm_mobile/features/home/domain/member_dashboard_gateway.dart';

final class LoadMemberDashboard {
  const LoadMemberDashboard(this._gateway);

  final MemberDashboardGateway _gateway;

  Future<MemberDashboard> call() => _gateway.loadDashboard();
}
