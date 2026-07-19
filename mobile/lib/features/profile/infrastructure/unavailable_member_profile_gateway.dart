import 'package:cnpm_mobile/features/profile/domain/member_profile.dart';
import 'package:cnpm_mobile/features/profile/domain/member_profile_gateway.dart';

final class UnavailableMemberProfileGateway implements MemberProfileGateway {
  const UnavailableMemberProfileGateway();

  @override
  Future<MemberProfileResult> loadProfile() async {
    return const MemberProfileUnavailable(
      'Aucun contrat HTTP typé ne permet de charger le profil membre et l’entreprise. Aucune donnée générique n’est interprétée.',
    );
  }
}
