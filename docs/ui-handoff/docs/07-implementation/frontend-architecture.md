# Architecture UI Web — Angular

## Structure recommandée

```text
web/src/app/
├── core/                 # auth, api, guards, interceptors, telemetry
├── layout/               # public, admin, member shells
├── design-system/        # composants génériques, directives, pipes
├── shared/               # composants réutilisables non fondamentaux
├── features/
│   ├── public/
│   ├── auth/
│   ├── members/
│   ├── enrollments/
│   ├── contributions/
│   ├── payments/
│   ├── receipts/
│   ├── recovery/
│   ├── requests/
│   ├── reporting/
│   ├── security/
│   └── showcases/
├── state/                # états transverses strictement nécessaires
└── app.routes.ts
```

## Principes

- Composants standalone et détection optimisée selon la version approuvée.
- Features chargées paresseusement.
- Le design system ne dépend d’aucune feature métier.
- Les services API retournent des DTO ; les composants consomment des view models.
- Les permissions sont vérifiées côté serveur ; le frontend adapte l’interface.
- Les états URL (filtres, tri, tabs, sélection) sont synchronisés via router.
- Les événements de télémétrie ne contiennent pas de données personnelles ou financières.

## CSS

- SCSS global limité aux tokens, reset, typographie, utilitaires de layout et styles d’impression.
- Encapsulation des composants conservée.
- Éviter `::ng-deep`.
- Aucune couleur hexadécimale dans les features.
- Préférer CSS Grid pour les pages et Flexbox pour les groupes de contrôles.

## Catalogue de composants et Storybook

Le contrat cible prévoit Storybook, mais son installation reste soumise au gate `web/package.ui-handoff.json`. Tant que ce gate est ouvert, les variantes sont couvertes par des composants de démonstration internes, Vitest, Playwright et axe. Après fermeture du gate, chaque composant P0 possède :

- Default ;
- tous états ;
- tailles/densités ;
- erreurs ;
- dark context seulement pour test logo si pertinent ;
- viewport mobile ;
- test d’interaction ;
- audit axe.
