# Instructions agents — Plateforme digitale CNPM

## Mission
Implémenter la plateforme CNPM à partir des exigences, contrats, règles de sécurité et spécifications UI/UX du dépôt. Toute ambiguïté institutionnelle ou métier doit être remontée ; elle ne doit jamais être résolue par invention.

## Lecture obligatoire avant modification
1. `START_HERE.md`
2. `docs/00-governance/source-of-truth.md`
3. `docs/00-governance/open-decisions.md`
4. La story concernée dans `docs/01-product/`
5. Les documents techniques concernés sous `docs/02-architecture/` à `docs/10-operations/`
6. Pour le frontend ou le mobile : `docs/ui-handoff/START_HERE.md`
7. Pour la vitrine membre : `docs/12-member-showcase/README.md` et sa checklist de promotion

## Règles générales
- Travailler dans une branche dédiée à une story ou une correction.
- Présenter un plan avant une modification structurante.
- Maintenir la traçabilité exigence → story → code → test.
- Ne jamais modifier les documents sources sous `docs/00-sources/`.
- Ne jamais utiliser de données réelles de membres, secrets, signatures, cachets ou QR officiels dans les tests.
- Signaler explicitement les tests non exécutés et les risques résiduels.

## Architecture et backend
- Monolithe modulaire, architecture hexagonale, frontières décrites dans `docs/02-architecture/modules.md`.
- Contrôleurs sans logique métier ; DTO distincts des entités de persistance.
- Dépendances intermodules via ports applicatifs ou événements documentés.
- Outbox transactionnelle pour les événements métier fiables.
- Vérification des permissions côté backend ; l’interface n’est jamais une frontière de sécurité.

## PostgreSQL et Flyway
- PostgreSQL est la seule base relationnelle de production.
- Une seule source de migrations : `backend/src/main/resources/db/migration/`.
- Montants en `numeric(19,2)`, horodatages en `timestamptz`, identifiants techniques UUID.
- Pas de suppression ou modification destructive d’une écriture financière validée.
- Migrations versionnées, testées sur PostgreSQL éphémère et accompagnées d’un plan de retour arrière si nécessaire.

## API, intégrations et sécurité
- `docs/04-api/openapi.yaml` et `docs/04-api/asyncapi.yaml` sont contractuels.
- Erreurs normalisées, corrélation, pagination, limitation des exports et idempotence.
- Toutes les intégrations externes sont isolées derrière des adaptateurs.
- 2FA pour les rôles sensibles ; RBAC et séparation des tâches obligatoires.
- Aucun secret en clair dans Git, les logs, les fixtures ou les captures.

## Web Angular
- TypeScript strict, composants autonomes, routes de feature chargées à la demande.
- Formulaires réactifs typés ; appels API hors des composants de présentation.
- Réutiliser les contrats et styles sous `web/src/app/ui-contracts/` et `web/src/styles/`.
- Conserver filtres, tri, onglets et sélection dans l’URL lorsque la vue est partageable.
- Tests d’interaction, axe et Playwright pour les composants et écrans P0 ; Storybook uniquement après fermeture du gate de compatibilité documenté dans `web/package.ui-handoff.json`.

## Mobile Flutter
- Séparer présentation, cas d’usage, domaine et infrastructure.
- Utiliser `mobile/lib/design_system/` et supporter 360, 390 et 430 px logiques.
- Stockage sensible chiffré ; files hors ligne idempotentes.
- Aucune confirmation financière, émission de reçu ou validation sensible hors ligne.
- Tests widget, golden et sémantiques pour les écrans P0.

## UI/UX et accessibilité
- Les tokens de `docs/ui-handoff/design-tokens/` sont normatifs.
- Pas de grands cadres colorés décoratifs, dégradés gratuits, effets de verre ou ombres lourdes.
- Une action primaire dominante par zone fonctionnelle.
- WCAG 2.2 AA, clavier complet, focus visible, labels/erreurs associés, reflow 320 px et zoom 200 %.
- Les références PNG guident la composition ; elles ne remplacent pas les fiches écran.
- Toute vitrine membre suit le gabarit contraint, la modération et les règles de consentement documentées.

## Validation minimale
- `bash scripts/validate-pack.sh`
- Tests unitaires et d’intégration du module modifié.
- Tests OpenAPI et migrations si concernés.
- Lint, build, axe et captures responsive pour une interface.
- Revue architecture, données, API, sécurité ou UI selon l’impact.

## Livraison d’une tâche
Indiquer : fichiers modifiés, décisions prises, commandes exécutées, résultats, captures ou preuves, migrations, impacts API, risques résiduels et décisions encore ouvertes.
