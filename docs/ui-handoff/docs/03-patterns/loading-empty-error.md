# Pattern — Chargement, vide et erreur

## Matrice minimale par écran

| État | Présentation | Action |
|---|---|---|
| Chargement initial | Skeleton fidèle à la structure | aucune |
| Rafraîchissement | Indicateur local, données conservées | annuler si long |
| Première utilisation | Illustration sobre + explication | créer/configurer |
| Aucun résultat | Résumé des filtres | effacer filtres |
| Erreur récupérable | Message contextualisé | réessayer |
| Accès interdit | Raison générique + support | retour |
| Session expirée | Explication | se reconnecter |
| Hors connexion | Bannière persistante | voir données locales |
| Synchronisation | Statut et nombre d’éléments | voir la file |
| Maintenance | Fenêtre et support | revenir plus tard |

Ne jamais afficher une page blanche ou un spinner indéfini.
