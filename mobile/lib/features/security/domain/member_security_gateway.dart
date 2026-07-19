import 'package:cnpm_mobile/features/security/domain/member_security.dart';

abstract interface class MemberSecurityGateway {
  Future<MemberSecurityResult> loadSecurity();
}
