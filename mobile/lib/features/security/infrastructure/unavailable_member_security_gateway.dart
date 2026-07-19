import 'package:cnpm_mobile/features/security/domain/member_security.dart';
import 'package:cnpm_mobile/features/security/domain/member_security_gateway.dart';

final class UnavailableMemberSecurityGateway implements MemberSecurityGateway {
  const UnavailableMemberSecurityGateway();

  @override
  Future<MemberSecurityResult> loadSecurity() async {
    return const MemberSecurityUnavailable(
      'Aucun contrat HTTP typé ne permet de consulter les méthodes 2FA, sessions ou appareils. L’application mobile reste fermée par défaut.',
    );
  }
}
