---
paths:
  - "web/**/*.ts"
  - "web/**/*.html"
  - "web/**/*.scss"
  - "web/**/*.json"
---
# Frontend Angular

- Utiliser Angular 22, TypeScript strict, composants autonomes et routes de fonctionnalité chargées paresseusement.
- Utiliser des formulaires réactifs typés.
- Aucun appel HTTP direct depuis les composants de présentation ; mapper les DTO API vers des view models.
- Les composants génériques du design system ne dépendent jamais des services métier.
- Utiliser les tokens de `docs/ui-handoff/design-tokens/` ; aucune couleur hexadécimale ou valeur d’espacement arbitraire dans les styles de fonctionnalité.
- Ne pas utiliser `innerHTML` pour le contenu membre sans politique de nettoyage approuvée.
- Ne pas utiliser `::ng-deep`, sauf contournement temporaire documenté.
- Conserver dans l’URL les filtres, tris, onglets et identifiants sélectionnés lorsque la vue est partageable.
- Prévoir chargement, vide, aucun résultat, erreur, interdit, succès et reprise réseau pour chaque vue de données.
- Les permissions UI améliorent l’expérience mais ne remplacent jamais le contrôle backend.
- Ajouter tests d’interaction, axe et régression visuelle aux composants et écrans P0. Ajouter Storybook seulement après validation d’une version compatible, conformément à `web/package.ui-handoff.json`.
- Respecter WCAG 2.2 AA, navigation clavier, focus visible et localisation de tout texte affiché.
