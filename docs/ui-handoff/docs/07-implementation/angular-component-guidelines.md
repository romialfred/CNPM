# Directives Angular pour les composants

## API

- Inputs typés, immuables et avec valeurs par défaut explicites.
- Outputs sémantiques.
- `ChangeDetectionStrategy.OnPush` ou équivalent moderne.
- Aucun accès direct à `window` sans abstraction testable.
- IDs générés de façon stable pour labels/erreurs.
- Les textes visibles passent par i18n.

## Formulaires

- Reactive Forms typés.
- Validateurs métier testés séparément.
- Mapper erreurs backend vers codes UI.
- Brouillons dans un service dédié, pas dans le composant.
- Désactiver le submit pendant un appel, mais conserver Annuler/Retour si sûr.

## Tables

- Pagination, filtre et tri serveur pour grands volumes.
- Colonnes décrites par métadonnées.
- Virtualisation seulement après mesure ; ne pas sacrifier l’accessibilité.
- L’état de sélection n’est pas indexé par position de ligne.

## Sécurité

- Ne jamais utiliser `innerHTML` avec contenu membre sans sanitisation et politique.
- Les URLs média sont validées.
- Les téléchargements utilisent des noms sûrs et contrôles serveur.
- Les claims de rôle ne remplacent pas l’autorisation serveur.
