enum MemberRequestStatus { inProgress, awaitingMember, resolved }

final class MemberRequest {
  const MemberRequest({
    required this.reference,
    required this.subject,
    required this.categoryLabel,
    required this.createdOn,
    required this.status,
  });

  final String reference;
  final String subject;
  final String categoryLabel;
  final DateTime createdOn;
  final MemberRequestStatus status;
}
