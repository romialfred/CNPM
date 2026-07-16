# Contrats de webhooks

## Entrants
- Signature HMAC ou asymétrique, timestamp, nonce et fenêtre anti-rejeu.
- Identifiant événement externe unique protégé par contrainte PostgreSQL.
- Réponse rapide après validation minimale; traitement métier asynchrone.
- Payload brut chiffré ou empreinte conservée selon classification.

## Sortants
- Abonnement versionné, secret par destinataire, rotation sans interruption.
- Réessais exponentiels avec jitter, limite, file d’erreur et rejeu contrôlé.
- Les codes 2xx acquittent; 4xx permanents suspendent après seuil; 5xx sont repris.
- Aucun webhook ne contient plus de données que nécessaire.
