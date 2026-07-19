import 'package:cnpm_mobile/core/domain/member_content_failure.dart';
import 'package:cnpm_mobile/features/contributions/domain/member_contribution.dart';
import 'package:cnpm_mobile/features/contributions/domain/member_contribution_gateway.dart';

/// Le contrat `/portal/contributions` retourne encore `Resource`, sans schéma
/// financier typé. Le profil HTTP reste donc fermé plutôt que d'inventer un mapping.
final class UnavailableMemberContributionGateway
    implements MemberContributionGateway {
  const UnavailableMemberContributionGateway();

  @override
  Future<MemberContributionLookup> findContribution(String id) async {
    throw const MemberContentFailure(MemberContentFailureKind.unavailable);
  }

  @override
  Future<List<MemberContribution>> loadContributions() async {
    throw const MemberContentFailure(MemberContentFailureKind.unavailable);
  }
}
