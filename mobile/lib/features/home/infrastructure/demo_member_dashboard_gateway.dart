import 'package:cnpm_mobile/features/home/domain/member_dashboard.dart';
import 'package:cnpm_mobile/features/home/domain/member_dashboard_gateway.dart';

final class DemoMemberDashboardGateway implements MemberDashboardGateway {
  const DemoMemberDashboardGateway();

  @override
  Future<MemberDashboard> loadDashboard() async {
    return const MemberDashboard(
      organizationName: 'Entreprise Démo Sahel',
      memberReference: 'CNPM-DEMO-0001',
      accountLabel: 'Compte membre de démonstration',
      paymentsToReview: 2,
      openRequests: 2,
    );
  }
}
