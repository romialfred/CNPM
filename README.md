# Plateforme digitale du CNPM

Dépôt consolidé de conception et de démarrage de l’implémentation Web et mobile du Conseil National du Patronat du Mali.

## Périmètre

La plateforme couvre la gestion des membres et entreprises, groupements, adhésions, cotisations, paiements, rapprochements, reçus, recouvrement, primes, requêtes, documents, événements, gouvernance, reporting, portail membre, application mobile et vitrines publiques des membres.

## État du dépôt

- Documentation métier, architecture, PostgreSQL, API, sécurité, BPMN, tests et exploitation : présente.
- Handoff UI/UX consolidé : **101 écrans**, **74 composants**, tokens, références visuelles et tests de régression.
- Backend Spring Boot : squelette, configuration et migrations initiales présents ; compilation à exécuter sous Java 25/Maven.
- Web Angular : projet exécutable avec verrou npm ; `npm ci`, lint, **2 tests unitaires** et build de production validés sous Node 24.15.0.
- Mobile Flutter : fondations, thème et tests présents ; runners natifs et `pubspec.lock` à générer avec Flutter 3.44.0.
- Vitrine membre : exigences, modèle, permissions, recette et addendum OpenAPI de **11 opérations** préparés sous `docs/12-member-showcase/` pour promotion contrôlée en R4.
- Les décisions institutionnelles encore ouvertes sont listées dans `docs/00-governance/open-decisions.md`.

## Entrées principales

- `START_HERE.md` — ordre de lecture et démarrage.
- `CLAUDE.md` — instructions Claude Code.
- `AGENTS.md` — instructions Codex et autres agents.
- `PLANS.md` — séquence de réalisation.
- `docs/00-governance/source-of-truth.md` — hiérarchie documentaire.
- `docs/00-governance/source-preservation-audit.md` — contrôle des sources et empreintes.
- `docs/00-governance/root-markdown-placement.md` — placement exact des `.md`.
- `docs/ui-handoff/START_HERE.md` — implémentation des interfaces.

## Arborescence

```text
CNPM_Final/
├── CLAUDE.md
├── AGENTS.md
├── START_HERE.md
├── README.md
├── PLANS.md
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
├── NOTICE.md
├── backend/
├── web/
├── mobile/
├── docs/
│   ├── 00-sources/
│   ├── 00-governance/
│   ├── 01-product/
│   ├── 02-architecture/
│   ├── 03-data/
│   ├── 04-api/
│   ├── 05-security/
│   ├── 06-ux/
│   ├── 07-processes/
│   ├── 08-integrations/
│   ├── 09-testing/
│   ├── 10-operations/
│   ├── 11-claude-code/
│   ├── 12-member-showcase/
│   └── ui-handoff/
├── infrastructure/
├── scripts/
└── tests/
```

## Commandes

```bash
bash scripts/validate-pack.sh
bash scripts/validate-openapi.sh
mvn -f backend/pom.xml clean verify
cd web && npm ci && npm run lint && npm run test:ci && npm run build
cd mobile && flutter pub get && flutter analyze && flutter test
```

## Sources canoniques

Les documents officiels ne sont conservés qu’une seule fois :

- TDR et spécifications sous `docs/00-sources/` ;
- DCTD sous `docs/02-architecture/` ;
- backlog sous `docs/01-product/` ;
- dictionnaire PostgreSQL sous `docs/03-data/` ;
- RBAC sous `docs/05-security/` ;
- maquettes et actifs UI sous `docs/ui-handoff/assets/` ;
- migrations exécutables sous `backend/src/main/resources/db/migration/`.

## Confidentialité

Ce dépôt peut contenir des documents institutionnels. Ne pas le publier sans validation du CNPM. Les données des références visuelles sont fictives ou illustratives et ne doivent pas être utilisées en production.
