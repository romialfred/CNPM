import 'package:cnpm_mobile/features/profile/domain/member_profile.dart';

abstract interface class MemberProfileGateway {
  Future<MemberProfileResult> loadProfile();
}
