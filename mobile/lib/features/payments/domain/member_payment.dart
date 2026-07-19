enum MemberPaymentStatus { processing, needsReview }

final class MemberPayment {
  const MemberPayment({
    required this.reference,
    required this.amountXof,
    required this.submittedOn,
    required this.channelLabel,
    required this.status,
  });

  final String reference;
  final int amountXof;
  final DateTime submittedOn;
  final String channelLabel;
  final MemberPaymentStatus status;
}
