---
paths:
  - "mobile/**/*.dart"
  - "mobile/pubspec.yaml"
---
# Mobile Flutter

- Séparer présentation, cas d’usage, domaine et infrastructure.
- Utiliser exclusivement le thème et les tokens CNPM partagés.
- Supporter au minimum 360, 390 et 430 pixels logiques, les zones sûres et le redimensionnement du texte.
- Cible tactile minimale : 44 pixels logiques.
- Chiffrer le stockage local sensible, limiter sa durée de vie et ne jamais journaliser jetons ou détails financiers.
- Les opérations hors ligne sont placées dans une file idempotente avec états explicites en ligne, hors ligne et synchronisation.
- Aucune confirmation de paiement, émission de reçu ou validation sensible hors ligne ; ne jamais afficher une confirmation serveur prématurée.
- Afficher clairement les conflits et la stratégie de reprise.
- Ajouter tests de widgets, sémantique et golden tests pour les écrans P0.
