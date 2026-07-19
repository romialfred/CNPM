import 'package:cnpm_mobile/features/contributions/domain/member_contribution.dart';
import 'package:cnpm_mobile/features/contributions/domain/member_contribution_gateway.dart';

final class LoadMemberContribution {
  const LoadMemberContribution(this._gateway);

  final MemberContributionGateway _gateway;

  Future<MemberContributionLookup> call(String id) =>
      _gateway.findContribution(id);
}
