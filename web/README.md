# Application Web CNPM

Socle Angular 22 pour le site public, le portail membre et le back-office CNPM.

## Prérequis

- Node.js 24.15.0, fixé dans `../.nvmrc`, ou une version explicitement admise par la plage `engines` ;
- npm 10.9.2 ;
- API backend et Keycloak configurés pour les parcours intégrés.

## Installation et contrôles

```bash
nvm use
npm ci
npm run lint
npm run test:ci
npm run build
npm run test:a11y
npm run test:visual
```

Le fichier `package-lock.json` est versionné. Lors de la consolidation sous Node 24.15.0, les commandes suivantes ont réussi : `npm ci`, `npm run lint`, `npm run test:ci` avec deux tests réussis, et `npm run build`.

Les tests Playwright et axe nécessitent des écrans applicatifs démarrés et doivent devenir obligatoires dès l’implémentation des écrans pilotes.

## Storybook

L’intégration Storybook est volontairement différée jusqu’à validation d’une version compatible avec Angular 22 et TypeScript 6, sans `--force` ni `--legacy-peer-deps`. Le gate est défini dans :

- `package.ui-handoff.json` ;
- `../docs/ui-handoff/templates/storybook/README.md`.

Playwright, axe et Vitest assurent la couverture initiale de R0.

## Sources UI

- `../docs/ui-handoff/START_HERE.md`
- `../docs/ui-handoff/design-tokens/tokens.source.json`
- `../docs/ui-handoff/data/component-catalog.json`
- `../docs/ui-handoff/data/screen-inventory.json`

Les écrans pilotes sont `AUTH-001`, `PUB-001`, `PUB-006` et `BO-002`.
