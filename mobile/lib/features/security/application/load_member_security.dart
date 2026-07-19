import 'package:cnpm_mobile/features/security/domain/member_security.dart';
import 'package:cnpm_mobile/features/security/domain/member_security_gateway.dart';

final class LoadMemberSecurity {
  const LoadMemberSecurity(this._gateway);

  final MemberSecurityGateway _gateway;

  Future<MemberSecurityResult> call() => _gateway.loadSecurity();
}
