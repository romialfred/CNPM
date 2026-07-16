# Storybook — intégration différée

Le dépôt cible Angular 22, qui impose TypeScript 6.0. Au moment de la consolidation, la version stable de l’intégration Storybook Angular déclarait encore une dépendance pair TypeScript 5.x. Elle a donc été retirée du projet exécutable afin de conserver une installation reproductible sans `--force` ni `--legacy-peer-deps`.

Le catalogue de composants doit d’abord être implémenté et testé avec Angular, Vitest, Playwright et axe. Storybook pourra être ajouté par la CLI officielle dès qu’une version stable annonce la compatibilité Angular 22 / TypeScript 6. Ne pas réintroduire une version incompatible.
