# Rapport de réorganisation du dépôt CNPM

## Objet

Consolider l’archive `CNPM(1).zip` dans un dépôt unique, supprimer les copies exactes, placer les instructions agents à la bonne portée et rendre la structure exploitable par Claude Code, Codex et une équipe de développement.

## Dépôt canonique obtenu

La racine contient uniquement les instructions et politiques transversales :

- `CLAUDE.md` pour Claude Code ;
- `AGENTS.md` pour Codex et les autres agents ;
- `START_HERE.md`, `README.md` et `PLANS.md` ;
- `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `NOTICE.md` et `MANIFEST.md` ;
- la configuration de dépôt, la CI et les dossiers applicatifs.

Les règles spécialisées sont sous `.claude/`. Les documents métier, techniques et rapports de validation sont sous `docs/`. Le handoff UI/UX est consolidé sous `docs/ui-handoff/`.

## Consolidations réalisées

- fusion du pack technique et du pack UI/UX ;
- intégration des règles UI, accessibilité, vitrine et régression visuelle dans `.claude/` ;
- intégration des tokens et contrats UI dans `web/` et `mobile/` ;
- conservation d’une seule CI GitLab à la racine ;
- conservation d’une seule source Flyway sous `backend/src/main/resources/db/migration/` ;
- remplacement de l’ancien dossier UX contradictoire par un pointeur vers le handoff normatif ;
- suppression des caches, archives imbriquées, livrables répétés et variantes de logo non approuvées ;
- création et fusion des fichiers racine nécessaires à Claude Code et Codex ;
- ajout d’un projet Angular exécutable, d’un verrou npm déterministe et des fondations Flutter ;
- ajout des exigences, du modèle, des permissions, de la recette et de l’addendum API de la vitrine membre R4 ;
- ajout de validateurs de structure, contrats, documents, manifests et UI/UX.

## Doublons supprimés

L’archive source contenait plusieurs copies exactes des éléments suivants : TDR, spécifications fonctionnelles, DCTD, backlog, matrice RBAC, dictionnaire PostgreSQL, rapport de validation, guide UI/UX, matrice UI/UX, logo et maquettes.

Les dossiers racine suivants n’existent plus dans le dépôt final :

```text
BRS/
Documents/
Maquettes/
Dossier Operatiionel/
Dossier de conception technique/
Specifications fonctionnelles/
images/
CNPM_UI_UX_Handoff_v1.0/
deliverables/
```

Le détail des correspondances source → destination canonique se trouve dans `duplicate-removal.csv`.

## Copies générées conservées intentionnellement

Trois paires de fichiers ont le même contenu, mais sont maintenues comme sorties générées nécessaires aux outils applicatifs :

- `docs/ui-handoff/design-tokens/tokens.css` → `web/src/styles/tokens.css` ;
- `docs/ui-handoff/design-tokens/_tokens.scss` → `web/src/styles/_tokens.scss` ;
- `docs/ui-handoff/design-tokens/cnpm_theme.dart` → `mobile/lib/design_system/cnpm_theme.dart`.

La source est `docs/ui-handoff/design-tokens/tokens.source.json`. Les copies applicatives ne doivent pas être modifiées manuellement.

## Validation technique exécutée

- contrats OpenAPI : 77 opérations canoniques et 11 opérations dans l’addendum vitrine ;
- handoff UI/UX : 101 écrans, 74 composants et 14 références visuelles ;
- installation Web déterministe sous Node 24.15.0 ;
- lint Angular réussi ;
- deux tests unitaires réussis ;
- build Angular de production réussi ;
- validateurs JSON, YAML, XML, BPMN, OOXML, PDF, Flyway, doublons et manifestes réussis après régénération finale.

## Limites honnêtes

- le backend n’a pas été compilé localement : l’environnement de consolidation ne disposait pas de Java 25 ni de Maven ;
- Flutter n’était pas installé : les runners natifs et `pubspec.lock` restent une tâche R0 ;
- Docker n’était pas disponible : le démarrage des services doit être validé sur la machine de développement ;
- Storybook reste différé jusqu’à une version compatible Angular 22/TypeScript 6 sans contournement de dépendances ;
- une vulnérabilité faible de développement, transitive à Vite/esbuild, est documentée dans `toolchain-validation.md` ;
- les décisions institutionnelles listées dans `open-decisions.md` restent obligatoires avant les modules concernés.

## Validation finale

Exécuter à la racine :

```bash
bash scripts/validate-pack.sh
```

Le résultat de référence est enregistré dans `docs/00-governance/final-validation-report.md`.
