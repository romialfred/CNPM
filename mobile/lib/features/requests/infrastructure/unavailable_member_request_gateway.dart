import 'package:cnpm_mobile/core/domain/member_content_failure.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request_gateway.dart';

final class UnavailableMemberRequestGateway implements MemberRequestGateway {
  const UnavailableMemberRequestGateway();

  @override
  Future<List<MemberRequest>> loadRequests() {
    throw const MemberContentFailure(MemberContentFailureKind.unavailable);
  }
}
