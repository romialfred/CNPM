import 'package:cnpm_mobile/features/home/domain/member_dashboard.dart';

abstract interface class MemberDashboardGateway {
  Future<MemberDashboard> loadDashboard();
}
