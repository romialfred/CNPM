import 'package:cnpm_mobile/features/profile/domain/member_profile.dart';
import 'package:cnpm_mobile/features/profile/domain/member_profile_gateway.dart';

final class LoadMemberProfile {
  const LoadMemberProfile(this._gateway);

  final MemberProfileGateway _gateway;

  Future<MemberProfileResult> call() => _gateway.loadProfile();
}
