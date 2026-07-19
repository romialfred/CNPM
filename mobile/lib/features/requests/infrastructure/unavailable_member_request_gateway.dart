import 'package:cnpm_mobile/core/domain/member_content_failure.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request_gateway.dart';

final class UnavailableMemberRequestGateway implements MemberRequestGateway {
  const UnavailableMemberRequestGateway();

  @override
  Future<List<MemberRequest>> loadRequests() {
    throw const MemberContentFailure(MemberContentFailureKind.unavailable);
  }

  @override
  Future<MemberRequestLookup> findRequest(String id) async {
    return const MemberRequestUnavailable(
      'Le contrat HTTP ne fournit pas encore une conversation membre typée. Aucune donnée générique n’est interprétée.',
    );
  }

  @override
  Future<MemberRequestCreationResult> createRequest(
    NewMemberRequestDraft draft,
  ) async {
    return const MemberRequestCreationUnavailable(
      'Le contrat HTTP de création reste générique. La requête n’a pas été envoyée.',
    );
  }

  @override
  Future<SharedRequestMessageResult> addSharedMessage({
    required String requestId,
    required String body,
  }) async {
    return const SharedRequestMessageUnavailable(
      'Le contrat HTTP ne garantit pas encore un échange membre typé. Le message n’a pas été envoyé.',
    );
  }
}
