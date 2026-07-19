import 'package:cnpm_mobile/features/requests/domain/member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request_gateway.dart';

final class AddSharedRequestMessage {
  const AddSharedRequestMessage(this._gateway);

  final MemberRequestGateway _gateway;

  Future<SharedRequestMessageResult> call({
    required String requestId,
    required String body,
  }) => _gateway.addSharedMessage(requestId: requestId, body: body);
}
