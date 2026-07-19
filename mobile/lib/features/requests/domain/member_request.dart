enum MemberRequestStatus { inProgress, awaitingMember, resolved }

enum MemberRequestCategory { generalInformation, memberData, documentHelp }

enum SharedRequestMessageAuthor { member, cnpm }

final class MemberRequest {
  const MemberRequest({
    required this.id,
    required this.reference,
    required this.subject,
    required this.categoryLabel,
    required this.createdOn,
    required this.status,
    required this.targetDisclosure,
  });

  final String id;
  final String reference;
  final String subject;
  final String categoryLabel;
  final DateTime createdOn;
  final MemberRequestStatus status;
  final String targetDisclosure;
}

/// Métadonnée déclarative de démonstration. Aucun fichier n'est lu, stocké,
/// téléversé ou analysé par l'application mobile.
final class RequestAttachmentMetadata {
  const RequestAttachmentMetadata({required this.displayName});

  final String displayName;
}

/// Projection membre d'un échange explicitement partagé.
///
/// La visibilité interne n'est volontairement pas représentée dans le modèle
/// mobile, ce qui empêche sa restitution accidentelle dans MOB-013.
final class SharedRequestMessage {
  const SharedRequestMessage({
    required this.id,
    required this.author,
    required this.body,
    required this.sentAt,
  });

  final String id;
  final SharedRequestMessageAuthor author;
  final String body;
  final DateTime sentAt;
}

final class MemberRequestDetail {
  const MemberRequestDetail({
    required this.request,
    required this.description,
    required this.sharedMessages,
    required this.attachmentMetadata,
  });

  final MemberRequest request;
  final String description;
  final List<SharedRequestMessage> sharedMessages;
  final List<RequestAttachmentMetadata> attachmentMetadata;
}

final class NewMemberRequestDraft {
  const NewMemberRequestDraft({
    required this.category,
    required this.subject,
    required this.description,
    required this.attachmentDisplayName,
  });

  final MemberRequestCategory category;
  final String subject;
  final String description;
  final String? attachmentDisplayName;
}

sealed class MemberRequestLookup {
  const MemberRequestLookup();
}

final class MemberRequestFound extends MemberRequestLookup {
  const MemberRequestFound(this.detail);

  final MemberRequestDetail detail;
}

final class MemberRequestNotFound extends MemberRequestLookup {
  const MemberRequestNotFound();
}

final class MemberRequestUnavailable extends MemberRequestLookup {
  const MemberRequestUnavailable(this.reason);

  final String reason;
}

sealed class MemberRequestCreationResult {
  const MemberRequestCreationResult();
}

final class MemberRequestCreated extends MemberRequestCreationResult {
  const MemberRequestCreated(this.detail);

  final MemberRequestDetail detail;
}

final class MemberRequestCreationUnavailable
    extends MemberRequestCreationResult {
  const MemberRequestCreationUnavailable(this.reason);

  final String reason;
}

sealed class SharedRequestMessageResult {
  const SharedRequestMessageResult();
}

final class SharedRequestMessageAdded extends SharedRequestMessageResult {
  const SharedRequestMessageAdded(this.detail);

  final MemberRequestDetail detail;
}

final class SharedRequestMessageRequestNotFound
    extends SharedRequestMessageResult {
  const SharedRequestMessageRequestNotFound();
}

final class SharedRequestMessageUnavailable extends SharedRequestMessageResult {
  const SharedRequestMessageUnavailable(this.reason);

  final String reason;
}
