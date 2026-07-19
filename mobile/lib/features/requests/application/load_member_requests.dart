import 'package:cnpm_mobile/features/requests/domain/member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request_gateway.dart';

final class LoadMemberRequests {
  const LoadMemberRequests(this._gateway);

  final MemberRequestGateway _gateway;

  Future<List<MemberRequest>> call() => _gateway.loadRequests();
}
