# Modèle de menaces

## Actifs critiques
Données membres, identifiants légaux, paiements, références bancaires, reçus officiels, règles financières, rôles, journaux, secrets et sauvegardes.

## Menaces prioritaires
1. Usurpation d’un compte privilégié.
2. Double comptabilisation par répétition de webhook.
3. Modification non autorisée d’un barème ou d’une prime.
4. Rapprochement frauduleux ou annulation abusive.
5. Fuite par export ou journalisation.
6. Téléversement de document malveillant.
7. Contournement de périmètre entre groupements ou entreprises.
8. Indisponibilité des opérateurs de paiement.
9. Compromission de la chaîne CI/CD.
10. Altération ou suppression des journaux.

## Mesures
2FA/WebAuthn, moindre privilège, SoD, idempotence, contraintes PostgreSQL, append-only, approbation à quatre yeux, chiffrement, antivirus, contrôle de périmètre, files de reprise, artefacts signés, sauvegardes isolées et audit externe.

## Revue
Le modèle est mis à jour à chaque nouvelle intégration, changement d’architecture ou traitement de données sensibles.
