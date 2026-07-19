enum MemberDocumentStatus { catalogued, processing, expired }

final class MemberDocument {
  const MemberDocument({
    required this.id,
    required this.reference,
    required this.title,
    required this.categoryLabel,
    required this.versionLabel,
    required this.metadataRecordedOn,
    required this.status,
    required this.availabilityDisclosure,
  });

  final String id;
  final String reference;
  final String title;
  final String categoryLabel;
  final String versionLabel;
  final DateTime metadataRecordedOn;
  final MemberDocumentStatus status;
  final String availabilityDisclosure;
}

sealed class MemberDocumentCollection {
  const MemberDocumentCollection();
}

final class MemberDocumentsAvailable extends MemberDocumentCollection {
  const MemberDocumentsAvailable(this.documents);

  final List<MemberDocument> documents;
}

final class MemberDocumentsUnavailable extends MemberDocumentCollection {
  const MemberDocumentsUnavailable(this.reason);

  final String reason;
}
