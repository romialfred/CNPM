# État d'implémentation

Dernière mise à jour : 2026-07-17. Branche `master`.

Ce document est le constat factuel de l'état réel du dépôt, établi par audit initial.
Il prime sur toute affirmation d'avancement non accompagnée de preuve.

## 1. Écart central entre documentation et code

Le dépôt est une **baseline documentaire et contractuelle de très bonne qualité,
adossée à un code applicatif quasi inexistant**. L'écart est assumé et documenté
par `backend/README.md` ; il n'est pas dissimulé. Il doit néanmoins être rappelé
à chaque revue, car plusieurs documents décrivent la cible comme si elle était
atteinte.

| Périmètre | Cible documentée | État réel vérifié |
|---|---|---|
| Backend Java | 19 modules, 88 opérations | 2 fichiers Java (`Application`, `ProblemResponse`), 0 contrôleur, 0 test |
| Web Angular | 101 écrans, 74 composants | **4 écrans livrés** (AUTH-001 connexion et vérification, PUB-001, PUB-006, BO-002) ; **20 composants de design system** ; 2 shells sur 4 (`PublicShell`, `AdminShell`) |
| Mobile Flutter | Architecture 4 couches, écrans P0 | 5 fichiers Dart ; `pubspec.lock` et runners `android/`/`ios/` absents |
| PostgreSQL | 73 tables, immuabilité financière | **73 tables, correspondance exacte 1:1 ; 19/19 tables append-only protégées** |
| Contrats API | 88 opérations | 88 opérations déclarées, **0 implémentée** |

## 2. Toolchain

État au 2026-07-16 après remédiation R0 :

| Outil | Requis | État |
|---|---|---|
| Java | 25 | Temurin 25.0.3.9 installé. `java` par défaut reste 17 : `JAVA_HOME` doit être positionné explicitement. **`mvn verify` : BUILD SUCCESS.** |
| Maven | 3.9+ | 3.9.11 installé hors PATH global (`C:\Users\romia\tools\apache-maven-3.9.11`). |
| Node | `^22.22.3 \|\| ^24.15.0 \|\| >=26` (`.nvmrc` : 24.15.0) | 24.18.0 installé. `npm ci`/`lint`/`test:ci`/`build` : OK. |
| Flutter | 3.44 | **3.44.0 installé** (`C:\Users\romia\tools\flutter`). `pubspec.lock` généré, runners `android/`+`ios/` créés, `flutter analyze` : 0 issue, `flutter test` : OK. |
| Docker | Compose v2 | 29.2.1. `compose config` valide. |
| Python | 3.12+ | 3.14.3 via `python`. `python3` est un stub Microsoft Store non exécutable. |

> Java/Maven/Flutter ne sont pas dans le PATH global : `mvn` et `flutter` sont
> hors-PATH et `java` par défaut reste 17. Les commandes de build doivent
> positionner `JAVA_HOME` et le PATH (voir la CI, qui utilise des images épinglées
> et n'est donc pas affectée).

## 3. Contrôles exécutés et résultats

| Contrôle | Résultat | Preuve |
|---|---|---|
| `bash scripts/validate-pack.sh` | **OK** après correction | 1037 fichiers, 144 stories, 361 cas de test |
| `bash scripts/validate-openapi.sh` | **OK** | 88 opérations (77 + 11 addendum R4) |
| `docker compose config` | **OK** | Images toutes épinglées, aucune `latest` |
| `npm ci` / `lint` / `test:ci` / `build` | **OK** sous Node 24.18.0 | 2 tests passent ; bundle initial 197,62 kB |
| `mvn clean verify` | Voir §5 | Bloqué avant correction du `pom.xml` |
| `flutter analyze` / `flutter test` | **NON EXÉCUTÉ** | Flutter absent — risque non couvert |
| Playwright / axe | **NON EXÉCUTÉ** | Cible des routes inexistantes (§4) |

## 4. Contrôles verts qui ne vérifiaient rien

Motif récurrent le plus dangereux pour la gouvernance : des gates au vert sans
exécution réelle. Corrigés ou consignés :

- `validate-pack.sh` / `validate-openapi.sh` appelaient `python3`, occupé par un
  stub Microsoft Store : échec silencieux retourné comme succès, masquant une
  erreur réelle de manifeste. **Corrigé** (`scripts/python-bin.sh`).
- `check-toolchain.sh` déclarait `python3 OK` en affichant le message d'erreur du
  stub : seule la présence dans le PATH était testée, jamais l'exécution.
  **Corrigé** (statut `BROKEN` distinct de `MISSING`).
- `validate-pack.py` n'était pas gitignore-aware : suivre l'instruction
  `cp .env.example .env` de `START_HERE.md` cassait immédiatement la validation.
  **Corrigé** (`scripts/pack_paths.py`, règle unique partagée avec le générateur).
- CI `mobile-test` : la règle `exists:` exige `mobile/pubspec.lock` et
  `mobile/android/app/build.gradle`, **tous deux absents**. Le job ne s'exécute
  jamais et le pipeline reste vert sans jamais tester le mobile. **Ouvert.**
- Tests Playwright/axe : ciblent `/auth/login`, `/`, `/membres/:slug`,
  `/admin/members`, **aucune de ces routes n'existe**. Toute baseline générée
  aujourd'hui capturerait le placeholder. **Ouvert — ne pas générer de baseline.**

## 5. Défauts corrigés pendant l'audit initial

- `backend/pom.xml` déclarait `org.testcontainers:postgresql` et
  `junit-jupiter`, artefacts renommés en `testcontainers-postgresql` et
  `testcontainers-junit-jupiter` dans Testcontainers 2.x. Le POM était donc
  **illisible par Maven** : le backend n'avait jamais pu être compilé. **Corrigé.**
- Manifeste : `PROMPT_MAITRE_IMPLEMENTATION_CNPM_CLAUDE_CODE.md` absent. **Régénéré.**
- **`V4` ne protégeait pas contre `TRUNCATE`** : ses triggers `BEFORE UPDATE OR
  DELETE` de niveau ligne ne se déclenchent pas sur un `TRUNCATE`, rendant une
  écriture financière validée effaçable par un seul ordre SQL. Découvert par
  l'audit adversarial des tests. **Corrigé** par `V5` (triggers `BEFORE TRUNCATE`
  sur les 19 tables), avec test différentiel V4/V5.
- **CI `mobile-test`** : règle `exists:` sur `pubspec.lock` +
  `android/app/build.gradle` (absents, et Flutter 3.44 génère `build.gradle.kts`).
  **Corrigé** : gate sur `mobile/pubspec.yaml`.
- **Validateurs non gitignore-aware** : `node_modules`, `target`, `.dart_tool` et
  la doc d'un paquet npm contenant un exemple de clé faisaient échouer
  `validate-pack` dès l'installation prescrite. **Corrigé** : les contrôles
  portent désormais sur les fichiers **versionnés** (via `git ls-files`), pas sur
  le disque.

## 5bis. Preuves exécutables produites (R0)

- **17 tests d'intégration PostgreSQL** (Testcontainers `postgres:18.4`, JDK 25),
  tous verts :
  - migration depuis base vide (4 migrations, 17 schémas, 73 tables) ;
  - migration depuis la version précédente, **dérivée dynamiquement** du dépôt ;
  - apparition différentielle des 19 triggers append-only (V4) et des 19 gardes
    TRUNCATE (V5), vérifiée **table par table** et par la fonction appelée ;
  - refus réel d'`UPDATE`/`DELETE`/`TRUNCATE CASCADE` sur les écritures
    financières ; unicité de la clé d'idempotence ; refus des montants ≤ 0 ;
  - typage : aucun flottant, tout `numeric` non-score en `numeric(19,2)`,
    `timestamptz`, PK UUID **réellement contrainte** (pas seulement colonne `id`).
- Ces tests ont été **audités par un agent indépendant** (`test-reviewer`) avant
  d'être considérés comme des preuves ; l'audit a fait remonter le trou TRUNCATE
  et plusieurs faux verts, tous corrigés. Note du périmètre migrations après
  première passe : 0,5/1 → à réauditer après remédiation.

## 6. Incohérences documentaires ouvertes

- **Taxonomie de release** : arbitrée le 2026-07-16 — `PLANS.md` (R0–R5) fait
  foi. `docs/01-product/release-plan.md` (Release 0–3) et les 144 stories du
  backlog (`R1 - PoC / socle`, `R2 - Déploiement élargi`, `R3 - Innovation`)
  restent à réaligner. Voir `open-decisions.md` (DEC-013).
- `START_HERE.md` et `implementation-readiness.md` affirment que le socle Angular
  a passé lint, tests et build sous Node 24.15.0. Le résultat est cohérent sous
  Node 24.18.0, mais la formulation laisse entendre un socle applicatif plus
  avancé qu'il ne l'est (0 composant).

## 7. Prochaines actions R0

1. Installer Flutter 3.44, générer `pubspec.lock` et les runners natifs, puis
   réparer la règle CI `mobile-test` qui masque l'absence de contrôle.
2. Tests de migration Flyway (base vide + version précédente) via Testcontainers,
   désormais déclarables : `.claude/rules/testing.md` l'exige et l'infrastructure
   est prête mais inutilisée.
3. Sécurité runtime : `SecurityFilterChain`, Keycloak, RBAC — aujourd'hui 100 %
   documentaire, 0 % appliqué. Premier verrou avant tout endpoint.
4. Composants de design system P0, puis `AUTH-001`, `PUB-001`, `PUB-006`, `BO-002`.
5. CI : ajouter SAST, SBOM, scan de secrets dédié, SCA Maven et Dart.

## 8. Écrans livrés

Livrés selon la méthode « livrer d'abord, auditer ensuite » retenue par le
commanditaire : un audit indépendant par écran en fin de lot, et non cinq passes.

| Écran | Route | Fiche | Contrôles |
|---|---|---|---|
| AUTH-001 | `/auth/login`, `/auth/verify` | `ref-auth-001-login.md` | axe, focus, reflow, cibles tactiles |
| PUB-006 | `/membres/:slug` | vitrine R4 | axe, SEO, consentement contact, badge |
| PUB-001 | `/` | `ref-pub-001-home.md` | 7 scénarios, garde éprouvée par mutation |
| BO-002 | `/admin/members` | `ref-bo-002-members-list.md` | 19 scénarios, 2 gardes éprouvées par mutation |

**Total Playwright : 616 verts.** Les 24 échecs restants sont les baselines de
régression visuelle, délibérément non générées — voir §4.

### Ce que BO-002 ne livre pas, et pourquoi

Aucun de ces écarts n'est un oubli ; chacun a sa décision ouverte.

- Quatre des sept filtres de la maquette (secteur d'activité, région, niveau de
  cotisation, période d'adhésion) : aucune donnée ne les alimente — DATA-DEC-002.
- La cloche de notifications et le menu « Nouvelle action » du bandeau : aucune
  source, et le compteur « 8 » de la maquette est un chiffre d'image — UX-DEC-014.
- Les flux d'import et d'export : le « flux contrôlé avec rapport » qu'exige la
  fiche n'est pas spécifié. Les boutons sont rendus inertes et annoncent leur
  indisponibilité, plutôt que de conduire à un écran absent.
- Le tiroir du panneau de synthèse sous 1440 px : non spécifié. La synthèse passe
  sous la liste, ce qui la laisse lisible plutôt que masquée derrière un contrôle
  inventé.

### Écarts assumés par rapport à la maquette

- **La maquette est incohérente sur ses propres totaux** : elle affiche 1 126
  membres pour 3 842 actifs, et un total identique au nombre de dormants. La fiche
  l'anticipe (« aucun total incohérent ») et `ux-ui.md` interdit de recopier les
  chiffres faux d'une image générée. L'écran calcule ses agrégats depuis le jeu
  qu'il affiche : 30 = 23 actifs + 7 dormants, prospects comptés à part.
- **« Grand cotisant » n'est pas rendu comme un statut** mais comme un marqueur à
  côté du statut — DATA-DEC-001.
- **La table défile horizontalement sous 1672 px.** Ce n'est pas évitable : la fiche
  veut dix colonnes *et* un panneau de 288 px, ce qui ne laisse que 820 px à la table
  à 1440 px. La zone défilante est focalisable, porte `role="region"` et un libellé.
  À 1672 px — la largeur de la maquette — la table tient sans défilement.
