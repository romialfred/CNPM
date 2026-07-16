# Plan de test des migrations PostgreSQL

- Base vide vers dernière version.
- Version N-1 vers N avec jeu de données représentatif.
- Vérification des contraintes, index, commentaires et permissions.
- Mesure de durée et verrous; stratégie expand/migrate/contract si déploiement continu.
- Validation des doublons avant ajout d’unicité.
- Comparaison des totaux financiers avant/après.
- Test de sauvegarde et restauration avant migration majeure.
- Une migration publiée n’est jamais modifiée; une correction crée une nouvelle version.
