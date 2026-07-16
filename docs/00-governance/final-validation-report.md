# Rapport final de validation — CNPM Final

## Résultat

**Statut : VALIDÉ POUR LE DÉMARRAGE DE L’IMPLÉMENTATION R0**

Le dépôt a été consolidé à partir de l’archive `CNPM(1).zip`, dédupliqué, normalisé et organisé comme dépôt unique pour Claude Code, Codex et l’équipe de développement.

## Contrôles réussis

- structure canonique et fichiers d’instructions agents à la bonne portée ;
- absence des anciens packs et dossiers parallèles ;
- OpenAPI canonique : **77 opérations** ; addendum vitrine R4 : **11 opérations** ;
- handoff UI/UX : **101 écrans**, **74 composants**, **14 références visuelles** ;
- backlog : **144 stories** ;
- catalogue de recette : **361 cas** ;
- BPMN : **19 processus** ;
- JSON, YAML, XML et BPMN bien formés ;
- DOCX et XLSX valides comme archives OOXML ;
- PDF avec signature et fin de fichier valides ;
- une seule pipeline GitLab à la racine ;
- une seule source de migrations Flyway ;
- absence de caches, `node_modules`, builds, clés privées et images de conteneur `latest` dans l’archive ;
- doublons exacts supprimés, sauf les trois copies générées de tokens requises par les projets Web et mobile ;
- socle Web Angular validé sous Node 24.15.0 : `npm ci`, lint, deux tests unitaires et build de production réussis ;
- addendum de la vitrine membre R4 présent avec exigences, modèle, permissions, contrat OpenAPI de référence, recette et checklist de promotion ;
- garde-fou `PreToolUse` Claude Code testé : commandes sûres silencieuses, commandes destructives refusées ;
- manifestes SHA-256 du dépôt et du handoff UI/UX validés ;
- archive ZIP testée après extraction complète.

## Commande de contrôle

À exécuter à la racine :

```bash
bash scripts/validate-pack.sh
```

Résultat de référence :

```text
OpenAPI canonique OK: 77 opérations
Addendum vitrine R4 OK: 11 opérations
Contrats OpenAPI OK: 88 opérations documentées
CNPM UI/UX Handoff validation: files=178, screens=101, components=74, references=14
VALIDATION OK
Repository validation OK
Metrics: files=456, claude_lines=98, agents_lines=74, bpmn=19, backlog_rows=144, test_catalog_rows=361
```

## Fichiers Markdown placés à la racine

Les fichiers se terminant exactement par `.md` et conservés à la racine sont :

```text
CLAUDE.md
AGENTS.md
START_HERE.md
README.md
PLANS.md
CONTRIBUTING.md
SECURITY.md
CHANGELOG.md
NOTICE.md
MANIFEST.md
```

Le fichier `CLAUDE.local.md.example`, également placé à la racine, est un modèle et ne se termine pas par `.md`. Une éventuelle copie locale nommée `CLAUDE.local.md` reste ignorée par Git et ne doit pas être incluse dans une archive officielle.

Les règles spécialisées sont sous `.claude/`. Les documents métier, techniques, UI/UX et rapports de gouvernance sont sous `docs/`.

## Contrôles encore requis sur la machine de développement

- **Backend** : compiler et tester sous Java 25 avec Maven 3.9+ ; l’environnement de consolidation disposait seulement de Java 21 et sans Maven.
- **Mobile** : installer Flutter 3.44.0, générer les runners Android/iOS et `pubspec.lock`, puis exécuter `flutter analyze` et `flutter test`.
- **Infrastructure** : exécuter `docker compose config` et le démarrage local sur une machine disposant de Docker ou Podman compatible Compose.
- **Storybook** : l’ajouter uniquement après validation d’une version compatible Angular 22/TypeScript 6, sans `--force` ni `--legacy-peer-deps`.
- **Dépendances Web** : réévaluer à chaque mise à jour Angular/Vite la vulnérabilité faible transitive de développement Vite/esbuild documentée dans `toolchain-validation.md`.

Ces éléments sont des tâches R0 documentées ; ils ne sont pas présentés comme des contrôles déjà exécutés.

## Décisions bloquantes

Les arbitrages métier, institutionnels et UI encore ouverts sont enregistrés dans :

```text
docs/00-governance/open-decisions.md
```

Claude Code ou Codex doit arrêter la tâche concernée et demander un arbitrage lorsqu’une story dépend d’une décision encore ouverte.
