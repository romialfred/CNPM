import 'package:flutter_test/flutter_test.dart';

import 'package:cnpm_mobile/features/profile/domain/member_profile.dart';
import 'package:cnpm_mobile/features/profile/infrastructure/demo_member_profile_gateway.dart';
import 'package:cnpm_mobile/features/profile/infrastructure/unavailable_member_profile_gateway.dart';
import 'package:cnpm_mobile/features/security/domain/member_security.dart';
import 'package:cnpm_mobile/features/security/infrastructure/demo_member_security_gateway.dart';
import 'package:cnpm_mobile/features/security/infrastructure/unavailable_member_security_gateway.dart';

void main() {
  test(
    'MOB-016 expose une projection fictive sans coordonnée personnelle',
    () async {
      final result = await const DemoMemberProfileGateway().loadProfile();

      expect(result, isA<MemberProfileAvailable>());
      final profile = (result as MemberProfileAvailable).profile;
      expect(profile.displayLabel, 'Membre de démonstration');
      expect(profile.organizationName, 'Entreprise Démo Sahel');
      expect(profile.memberReference, startsWith('CNPM-DEMO-'));

      final safeProjection = [
        profile.displayLabel,
        profile.roleLabel,
        profile.organizationName,
        profile.memberReference,
        profile.organizationTypeLabel,
        profile.membershipLabel,
        profile.disclosure,
      ].join(' ');
      expect(safeProjection, isNot(contains('@')));
      expect(safeProjection, isNot(matches(RegExp(r'\+?[0-9][0-9 .-]{7,}'))));
      expect(safeProjection.toLowerCase(), isNot(contains('adresse')));
    },
  );

  test(
    'MOB-017 expose seulement des méthodes et appareils de scénario',
    () async {
      final result = await const DemoMemberSecurityGateway().loadSecurity();

      expect(result, isA<MemberSecurityAvailable>());
      final security = (result as MemberSecurityAvailable).security;
      expect(security.methods, hasLength(2));
      expect(security.devices, hasLength(2));
      expect(
        security.methods.every(
          (method) => method.id.startsWith('demo-method-'),
        ),
        isTrue,
      );
      expect(
        security.devices.every(
          (device) => device.id.startsWith('demo-device-'),
        ),
        isTrue,
      );

      final projection = [
        security.secondFactorLabel,
        security.secondFactorDisclosure,
        security.disclosure,
        ...security.methods.expand(
          (method) => [method.label, method.statusLabel, method.disclosure],
        ),
        ...security.devices.expand(
          (device) => [device.label, device.platformLabel],
        ),
      ].join(' ');
      expect(projection, isNot(contains('@')));
      expect(projection.toLowerCase(), isNot(contains('adresse ip')));
      expect(projection.toLowerCase(), isNot(contains('localisation')));
    },
  );

  test(
    'les profils HTTP MOB-016/MOB-017 restent fermés sans contrat typé',
    () async {
      final profile = await const UnavailableMemberProfileGateway()
          .loadProfile();
      final security = await const UnavailableMemberSecurityGateway()
          .loadSecurity();

      expect(profile, isA<MemberProfileUnavailable>());
      expect(security, isA<MemberSecurityUnavailable>());
    },
  );
}
