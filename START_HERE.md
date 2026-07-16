# Démarrage du projet CNPM

Ce dépôt est la source consolidée à remettre à Claude Code, Codex ou à l’équipe de développement. Il ne contient plus les packs parallèles ni les copies de livrables de l’archive d’origine.

## 1. Lire les instructions racine

1. `README.md` — périmètre, état et arborescence.
2. `CLAUDE.md` — règles permanentes pour Claude Code.
3. `AGENTS.md` — règles persistantes pour Codex et les autres agents.
4. `PLANS.md` — ordre d’exécution recommandé.
5. `docs/00-governance/implementation-readiness.md` — état réel de préparation.
6. `docs/00-governance/open-decisions.md` — arbitrages encore requis.
7. `docs/00-governance/root-markdown-placement.md` — emplacement exact des fichiers Markdown.

Les fichiers Markdown transversaux sont volontairement à la racine. Les règles spécialisées restent sous `.claude/` et la documentation détaillée sous `docs/`.

## 2. Lire les sources de vérité

- TDR et spécifications : `docs/00-sources/`
- Produit et backlog : `docs/01-product/`
- Architecture : `docs/02-architecture/`
- PostgreSQL : `docs/03-data/`
- API canoniques : `docs/04-api/`
- Sécurité : `docs/05-security/`
- Processus : `docs/07-processes/`
- Tests : `docs/09-testing/`
- Exploitation : `docs/10-operations/`
- Handoff UI/UX : `docs/ui-handoff/`
- Vitrine publique des membres, addendum R4 : `docs/12-member-showcase/`

## 3. Valider le dépôt

```bash
bash scripts/validate-pack.sh
```

Le contrôle vérifie la structure canonique, les contrats OpenAPI, les documents, BPMN, migrations Flyway, configuration Claude, handoff UI/UX, addendum vitrine, manifestes et absence des anciens dossiers dupliqués.

## 4. Préparer l’environnement local

```bash
cp .env.example .env
bash scripts/check-toolchain.sh

docker compose --env-file .env -f infrastructure/docker/compose.yaml config
docker compose --env-file .env -f infrastructure/docker/compose.yaml up -d
```

Les valeurs de `.env.example` sont uniquement locales. Ne jamais les réutiliser dans un environnement partagé.

## 5. Première séquence d’implémentation

1. Fermer les décisions bloquantes de la release R0.
2. Exécuter le backend sous Java 25/Maven 3.9 et générer les runners Flutter ainsi que `pubspec.lock` avec Flutter 3.44.0.
3. Établir CI/CD, IAM, audit, observabilité, PostgreSQL/Flyway et données synthétiques.
4. Implémenter les écrans pilotes `AUTH-001`, `PUB-001`, `PUB-006` et `BO-002`.
5. Valider le design system, le responsive et l’accessibilité avant de généraliser les autres parcours.
6. Développer ensuite par user story selon `PLANS.md` et le backlog.

Le socle Web Angular a déjà passé `npm ci`, le lint, les tests unitaires et le build de production sous Node 24.15.0. Les détails sont consignés dans `docs/00-governance/toolchain-validation.md`.

## 6. Règle de blocage

Ne pas coder un comportement dont le barème, l’autorité de validation, le partenaire, la base juridique, le contrat d’intégration ou l’actif officiel reste indéterminé. Mettre à jour le registre des décisions et demander l’arbitrage.
