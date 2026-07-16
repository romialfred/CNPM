# Environnement local

1. Copier `.env.example` vers `.env` et changer les valeurs locales.
2. Exécuter `docker compose --env-file ../../.env up -d` depuis ce dossier.
3. Ne jamais utiliser cette configuration en production.
4. Les services de stockage objet, antivirus, messagerie et paiement sont simulés par défaut et doivent être branchés selon les fiches d’intégration.
