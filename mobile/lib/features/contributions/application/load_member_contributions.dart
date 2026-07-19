import 'package:cnpm_mobile/features/contributions/domain/member_contribution.dart';
import 'package:cnpm_mobile/features/contributions/domain/member_contribution_gateway.dart';

final class LoadMemberContributions {
  const LoadMemberContributions(this._gateway);

  final MemberContributionGateway _gateway;

  Future<List<MemberContribution>> call() => _gateway.loadContributions();
}
