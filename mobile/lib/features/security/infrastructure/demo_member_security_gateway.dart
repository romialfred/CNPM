import 'package:cnpm_mobile/features/security/domain/member_security.dart';
import 'package:cnpm_mobile/features/security/domain/member_security_gateway.dart';

final class DemoMemberSecurityGateway implements MemberSecurityGateway {
  const DemoMemberSecurityGateway();

  @override
  Future<MemberSecurityResult> loadSecurity() async {
    return MemberSecurityAvailable(
      MemberSecuritySnapshot(
        secondFactorLabel: 'Actif dans le scénario de connexion',
        secondFactorDisclosure:
            'Ce statut illustre uniquement le parcours 2FA local de démonstration.',
        methods: const [
          SecurityMethodSnapshot(
            id: 'demo-method-otp',
            label: 'Code à usage unique de démonstration',
            statusLabel: 'Utilisé dans le parcours fictif',
            disclosure:
                'Aucun secret TOTP, QR ou code de récupération n’est créé ou conservé.',
          ),
          SecurityMethodSnapshot(
            id: 'demo-method-passkey',
            label: 'Clé d’accès',
            statusLabel: 'Non configurée',
            disclosure:
                'Aucune clé d’accès n’est demandée, enregistrée ou simulée localement.',
          ),
        ],
        devices: [
          SecurityDeviceSnapshot(
            id: 'demo-device-mobile',
            label: 'Téléphone de démonstration',
            platformLabel: 'Terminal mobile fictif',
            lastActivityAt: DateTime.utc(2026, 7, 18, 9, 30),
            isCurrentSession: true,
          ),
          SecurityDeviceSnapshot(
            id: 'demo-device-browser',
            label: 'Navigateur de test',
            platformLabel: 'Session web fictive',
            lastActivityAt: DateTime.utc(2026, 7, 16, 14, 10),
            isCurrentSession: false,
          ),
        ],
        disclosure:
            'La gestion réelle des méthodes, sessions et appareils relève du fournisseur d’identité central une fois les contrats validés.',
      ),
    );
  }
}
