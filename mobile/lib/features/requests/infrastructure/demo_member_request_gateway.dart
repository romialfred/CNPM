import 'package:cnpm_mobile/features/requests/domain/member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request_gateway.dart';

final class DemoMemberRequestGateway implements MemberRequestGateway {
  const DemoMemberRequestGateway();

  @override
  Future<List<MemberRequest>> loadRequests() async {
    return [
      MemberRequest(
        reference: 'DEMO-REQ-0003',
        subject: 'Mise à jour des informations de contact',
        categoryLabel: 'Données du membre',
        createdOn: DateTime.utc(2026, 7, 16),
        status: MemberRequestStatus.awaitingMember,
      ),
      MemberRequest(
        reference: 'DEMO-REQ-0002',
        subject: 'Question sur un document du portail',
        categoryLabel: 'Assistance documentaire',
        createdOn: DateTime.utc(2026, 7, 9),
        status: MemberRequestStatus.inProgress,
      ),
      MemberRequest(
        reference: 'DEMO-REQ-0001',
        subject: 'Correction de la raison sociale',
        categoryLabel: 'Données du membre',
        createdOn: DateTime.utc(2026, 6, 28),
        status: MemberRequestStatus.resolved,
      ),
    ];
  }
}
