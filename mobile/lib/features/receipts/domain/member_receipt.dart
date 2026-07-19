enum MemberReceiptStatus { demonstrationAvailable, demonstrationCancelled }

/// Projection mobile strictement en lecture seule pour MOB-009/MOB-010.
///
/// Elle décrit un scénario d'interface et non un reçu officiel. La référence,
/// le statut et la provenance restent donc intrinsèquement démonstratifs, même
/// si le widget est utilisé hors du profil de démonstration.
final class MemberReceipt {
  const MemberReceipt({
    required this.id,
    required this.reference,
    required this.periodLabel,
    required this.amountXof,
    required this.scenarioDate,
    required this.status,
    required this.sourceDisclosure,
    required this.paymentDisclosure,
    required this.proofDisclosure,
  });

  final String id;
  final String reference;
  final String periodLabel;
  final int amountXof;
  final DateTime scenarioDate;
  final MemberReceiptStatus status;
  final String sourceDisclosure;
  final String paymentDisclosure;
  final String proofDisclosure;
}

sealed class MemberReceiptCollection {
  const MemberReceiptCollection();
}

final class MemberReceiptsAvailable extends MemberReceiptCollection {
  const MemberReceiptsAvailable(this.receipts);

  final List<MemberReceipt> receipts;
}

final class MemberReceiptsUnavailable extends MemberReceiptCollection {
  const MemberReceiptsUnavailable(this.reason);

  final String reason;
}

sealed class MemberReceiptLookup {
  const MemberReceiptLookup();
}

final class MemberReceiptFound extends MemberReceiptLookup {
  const MemberReceiptFound(this.receipt);

  final MemberReceipt receipt;
}

final class MemberReceiptNotFound extends MemberReceiptLookup {
  const MemberReceiptNotFound();
}

final class MemberReceiptUnavailable extends MemberReceiptLookup {
  const MemberReceiptUnavailable(this.reason);

  final String reason;
}
