import 'package:cnpm_mobile/features/documents/domain/member_document.dart';
import 'package:cnpm_mobile/features/documents/domain/member_document_gateway.dart';

final class LoadMemberDocuments {
  const LoadMemberDocuments(this._gateway);

  final MemberDocumentGateway _gateway;

  Future<MemberDocumentCollection> call() => _gateway.loadDocuments();
}
