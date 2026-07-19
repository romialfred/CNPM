import 'package:cnpm_mobile/features/documents/domain/member_document.dart';
import 'package:cnpm_mobile/features/documents/domain/member_document_gateway.dart';

final class UnavailableMemberDocumentGateway implements MemberDocumentGateway {
  const UnavailableMemberDocumentGateway();

  @override
  Future<MemberDocumentCollection> loadDocuments() async {
    return const MemberDocumentsUnavailable(
      'Le catalogue HTTP retourne encore une ressource générique. Aucune métadonnée documentaire n’est interprétée.',
    );
  }
}
