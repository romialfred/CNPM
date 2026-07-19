import 'package:cnpm_mobile/features/documents/domain/member_document.dart';

abstract interface class MemberDocumentGateway {
  Future<MemberDocumentCollection> loadDocuments();
}
