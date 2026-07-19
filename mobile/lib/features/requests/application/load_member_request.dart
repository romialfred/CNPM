import 'package:cnpm_mobile/features/requests/domain/member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request_gateway.dart';

final class LoadMemberRequest {
  const LoadMemberRequest(this._gateway);

  final MemberRequestGateway _gateway;

  Future<MemberRequestLookup> call(String id) => _gateway.findRequest(id);
}
