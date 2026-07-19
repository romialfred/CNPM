final class MemberDashboard {
  const MemberDashboard({
    required this.organizationName,
    required this.memberReference,
    required this.accountLabel,
    required this.paymentsToReview,
    required this.openRequests,
  });

  final String organizationName;
  final String memberReference;
  final String accountLabel;
  final int paymentsToReview;
  final int openRequests;
}
