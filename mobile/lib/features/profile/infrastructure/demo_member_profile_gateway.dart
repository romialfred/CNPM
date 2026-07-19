import 'package:cnpm_mobile/features/profile/domain/member_profile.dart';
import 'package:cnpm_mobile/features/profile/domain/member_profile_gateway.dart';

final class DemoMemberProfileGateway implements MemberProfileGateway {
  const DemoMemberProfileGateway();

  @override
  Future<MemberProfileResult> loadProfile() async {
    return MemberProfileAvailable(
      MemberProfileSnapshot(
        displayLabel: 'Membre de démonstration',
        roleLabel: 'Administrateur fictif de l’entreprise',
        organizationName: 'Entreprise Démo Sahel',
        memberReference: 'CNPM-DEMO-0001',
        organizationTypeLabel: 'Entreprise fictive',
        membershipLabel: 'Adhésion active — scénario',
        membershipSince: DateTime.utc(2024, 3, 18),
        disclosure:
            'Projection locale fictive et non modifiable. Aucune coordonnée personnelle ni donnée membre réelle n’est affichée.',
      ),
    );
  }
}
