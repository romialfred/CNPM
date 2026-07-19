import 'package:cnpm_mobile/features/requests/domain/member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request_gateway.dart';

final class CreateMemberRequest {
  const CreateMemberRequest(this._gateway);

  final MemberRequestGateway _gateway;

  Future<MemberRequestCreationResult> call(NewMemberRequestDraft draft) =>
      _gateway.createRequest(draft);
}
