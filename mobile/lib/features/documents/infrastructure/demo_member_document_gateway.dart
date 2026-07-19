import 'package:cnpm_mobile/features/documents/domain/member_document.dart';
import 'package:cnpm_mobile/features/documents/domain/member_document_gateway.dart';

final class DemoMemberDocumentGateway implements MemberDocumentGateway {
  const DemoMemberDocumentGateway();

  @override
  Future<MemberDocumentCollection> loadDocuments() async {
    return MemberDocumentsAvailable([
      MemberDocument(
        id: 'demo-document-0001',
        reference: 'DEMO-DOC-0001',
        title: 'Attestation d’adhésion — scénario 2026',
        categoryLabel: 'Attestation fictive',
        versionLabel: 'Version de démonstration 1',
        metadataRecordedOn: DateTime.utc(2026, 7, 12),
        status: MemberDocumentStatus.catalogued,
        availabilityDisclosure:
            'Métadonnées consultatives uniquement. Aucun fichier ni preuve officielle n’est disponible.',
      ),
      MemberDocument(
        id: 'demo-document-0002',
        reference: 'DEMO-DOC-0002',
        title: 'Carte membre — aperçu de catalogue',
        categoryLabel: 'Carte membre fictive',
        versionLabel: 'Version de démonstration 2',
        metadataRecordedOn: DateTime.utc(2026, 7, 5),
        status: MemberDocumentStatus.processing,
        availabilityDisclosure:
            'Traitement fictif de la métadonnée. Aucun document n’est généré ou analysé.',
      ),
      MemberDocument(
        id: 'demo-document-0003',
        reference: 'DEMO-DOC-0003',
        title: 'Attestation annuelle — scénario 2025',
        categoryLabel: 'Attestation fictive',
        versionLabel: 'Version de démonstration 1',
        metadataRecordedOn: DateTime.utc(2025, 12, 18),
        status: MemberDocumentStatus.expired,
        availabilityDisclosure:
            'Échéance fictive dépassée. Aucun renouvellement ni alerte réelle n’est déclenché.',
      ),
    ]);
  }
}
