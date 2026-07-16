# Feedback et états système

## Toast

- Succès : confirmation brève, non bloquante.
- Erreur d’action : message + récupération ; conserver aussi une erreur près du contexte.
- Action annulable : proposer « Annuler » pendant une durée raisonnable.
- Un toast ne porte jamais une information financière critique comme unique confirmation.

## Alertes

- `info` : contexte utile.
- `warning` : action recommandée ou risque.
- `error` : action impossible ou donnée invalide.
- `success` : résultat confirmé.

Les alertes sont sobres, avec un bord ou un fond sémantique très léger. Éviter les grands blocs saturés.

## Chargement

- Skeleton pour les cartes/tables connues.
- Barre de progression pour import/export et publication.
- Spinner dans le bouton pour une action localisée.
- Désactiver les actions incompatibles pendant le traitement, sans bloquer toute la page inutilement.

## États vides

Distinguer : première utilisation, zéro donnée légitime, aucun résultat après filtre, erreur de chargement, accès interdit. Chaque état propose une prochaine action appropriée.
