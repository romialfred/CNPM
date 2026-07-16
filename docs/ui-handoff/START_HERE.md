# Démarrage du handoff UI/UX CNPM

## Ordre de lecture
1. `docs/00-governance/source-of-truth.md`
2. `docs/01-foundations/design-principles.md`
3. `docs/01-foundations/design-tokens.md`
4. `docs/02-components/component-catalog.md`
5. `docs/03-patterns/responsive-behavior.md`
6. `docs/04-screens/screen-inventory.md`
7. La fiche détaillée sous `docs/04-screens/reference-specs/`
8. `docs/06-accessibility/accessibility-requirements.md`
9. `docs/08-quality/visual-regression.md`
10. `CLAUDE.md` ou `AGENTS.md` à la racine du dépôt

## Séquence recommandée
### UI-0 — Fondations
Tokens, typographie approuvée, shells public/back-office/portail/mobile, icônes, accessibilité, Playwright, fixtures et préparation Storybook soumise au gate de compatibilité Angular 22/TypeScript 6.

### UI-1 — Composants P0
Boutons, champs, sélecteurs, tables, filtres, badges, alertes, dialogues, stepper, navigation, upload, squelettes, états vides et erreurs.

### UI-2 — Écrans pilotes
1. `AUTH-001` Connexion / 2FA
2. `PUB-001` Accueil public
3. `PUB-006` Vitrine publique membre
4. `BO-002` Liste des membres

### UI-3 — Parcours métier P0
Enrôlement, cotisations, paiement, rapprochement, reçus, requêtes et portail membre.

### UI-4 — Décisionnel, recouvrement, administration et mobile

## Critère de réussite
Un écran est terminé lorsque sa structure, ses comportements, ses états, son accessibilité, ses viewports et ses tests respectent les spécifications, et que les écarts visuels sont revus et documentés.
