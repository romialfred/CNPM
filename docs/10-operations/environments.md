# Environnements

| Environnement | Finalité | Données | Accès | Déploiement |
|---|---|---|---|---|
| Local | Développement individuel | Synthétiques | Développeur | Manuel/compose |
| DEV | Intégration continue | Synthétiques | Équipe | Automatique |
| TEST | Tests intégration/E2E | Synthétiques | QA/équipe | Automatique |
| STAGING | Démonstration fonctionnelle | Synthétiques réalistes | Projet | Contrôlé |
| PRÉPROD | Répétition production | Anonymisées si autorisé | Restreint | Approbation |
| PROD | Service officiel | Réelles | Très restreint | Double approbation |
| PRA | Reprise | Chiffrées/répliquées | Crise | Procédure PRA |

Aucun secret n’est partagé entre environnements. Les accès production sont nominatifs, temporaires et audités.
