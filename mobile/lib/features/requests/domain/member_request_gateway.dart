import 'package:cnpm_mobile/features/requests/domain/member_request.dart';

abstract interface class MemberRequestGateway {
  Future<List<MemberRequest>> loadRequests();
}
