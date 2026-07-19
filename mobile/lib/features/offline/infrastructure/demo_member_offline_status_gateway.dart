import 'package:cnpm_mobile/features/offline/domain/member_offline_status.dart';
import 'package:cnpm_mobile/features/offline/domain/member_offline_status_gateway.dart';

final class DemoMemberOfflineStatusGateway
    implements MemberOfflineStatusGateway {
  const DemoMemberOfflineStatusGateway();

  @override
  Future<MemberOfflineStatusResult> loadStatus() async {
    return MemberOfflineStatusAvailable(
      MemberOfflineStatusSnapshot(
        modeLabel: 'Hors connexion — scénario fictif',
        observedAt: DateTime.utc(2026, 7, 19, 8, 45),
        summary:
            'Cet état local illustre une connectivité indisponible sans mesurer le réseau réel du téléphone.',
        capabilities: const [
          OfflineCapabilitySnapshot(
            id: 'demo-offline-preview',
            label: 'Aperçu local de démonstration',
            detail:
                'Consultation de métadonnées fictives déjà présentes dans ce scénario.',
            availability: OfflineCapabilityAvailability.localOnly,
          ),
          OfflineCapabilitySnapshot(
            id: 'demo-offline-metadata',
            label: 'Préparation de métadonnées non sensibles',
            detail:
                'Références locales fictives uniquement, sans contenu métier ni pièce jointe.',
            availability: OfflineCapabilityAvailability.localOnly,
          ),
          OfflineCapabilitySnapshot(
            id: 'demo-offline-finance',
            label: 'Paiements, reçus et validations',
            detail:
                'Toujours bloqués hors connexion et sans confirmation explicite du serveur.',
            availability: OfflineCapabilityAvailability.blocked,
          ),
          OfflineCapabilitySnapshot(
            id: 'demo-offline-restricted-data',
            label: 'Documents et pièces KYC',
            detail:
                'Aucun document, contenu KYC ou donnée restreinte n’est stocké dans cette démonstration.',
            availability: OfflineCapabilityAvailability.blocked,
          ),
        ],
        disclosure:
            'Aucune requête réseau, mesure de connectivité, persistance sensible ou confirmation métier n’est exécutée.',
      ),
    );
  }
}
