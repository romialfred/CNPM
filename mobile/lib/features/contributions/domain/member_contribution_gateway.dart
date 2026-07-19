import 'package:cnpm_mobile/features/contributions/domain/member_contribution.dart';

abstract interface class MemberContributionGateway {
  Future<List<MemberContribution>> loadContributions();

  Future<MemberContributionLookup> findContribution(String id);
}
