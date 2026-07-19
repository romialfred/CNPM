import 'package:cnpm_mobile/features/requests/domain/member_request.dart';

abstract interface class MemberRequestGateway {
  Future<List<MemberRequest>> loadRequests();

  Future<MemberRequestLookup> findRequest(String id);

  Future<MemberRequestCreationResult> createRequest(
    NewMemberRequestDraft draft,
  );

  Future<SharedRequestMessageResult> addSharedMessage({
    required String requestId,
    required String body,
  });
}
