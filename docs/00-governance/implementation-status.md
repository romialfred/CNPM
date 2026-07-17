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
| AUTH-008 | `/auth/session-ended` | `loading-empty-error.md` (ligne « Session expirée ») | axe, h1 unique, reflow 320 px |
| PUB-006 | `/membres/:slug` | vitrine R4 | axe, SEO, consentement contact, badge |
| PUB-001 | `/` | `ref-pub-001-home.md` | 7 scénarios, garde éprouvée par mutation |
| BO-002 | `/admin/members` | `ref-bo-002-members-list.md` | 19 scénarios, 2 gardes éprouvées par mutation |

**Total Playwright : 672 verts + 60 tests unitaires.** Les 24 échecs restants sont
les baselines de régression visuelle, délibérément non générées — voir §4.

### Socle d'états (LOT 1, « premier passif »)

Le pattern `loading-empty-error.md` impose à tout écran de couvrir chargement, vide,
aucun résultat, erreur, accès interdit et session expirée, avec la règle dure « ne
jamais afficher une page blanche ou un spinner indéfini ». Les cinq composants
correspondants manquaient ; ils sont désormais livrés et réutilisés.

| Composant | Catalogue | États |
|---|---|---|
| `Skeleton` | FDB-005 | text, table, card, chart ; barres `aria-hidden`, occupation annoncée une fois |
| `EmptyState` | FDB-006 | first-use, no-results, no-data — réellement distincts |
| `ErrorState` | FDB-007 | recoverable, forbidden, not-found, offline, + session-ended (extension assumée) |
| `Toast` | FDB-003 | régions vivantes pré-montées ; erreurs et actions persistantes |
| `InlineErrorSummary` | FDB-004 | reçoit le focus à l'apparition, lie chaque erreur à son champ |

BO-002 a été reposé sur ces composants : ses états inline ont disparu au profit du
socle partagé. La dette de vocabulaire signalée par le plan (`badge` exposait
`critical` là où `status.contract.ts` impose `error`) est soldée.

Ce que ce lot NE livre PAS de LOT 1 : Storybook, la refonte de `PublicShell`, les
primitives `Section`/`Card`/`Link`/`IconButton`/`Breadcrumb`. Le socle d'états — le
« premier passif » que le plan place avant tout — est fait ; le reste de LOT 1 suit.

### Audit indépendant du socle (règle de non-auto-validation)

Le socle a été audité par des sous-agents indépendants du développeur — quatre
réviseurs spécialisés (accessibilité, correction, architecture, tests), puis chaque
constat soumis à deux sceptiques chargés de le réfuter. **13 constats soumis : 8
confirmés (≥ 2 sceptiques), 5 réfutés.** Les 8 confirmés ont tous été corrigés dans
le même incrément.

Corrections issues de l'audit :

- **BO-002 ne gérait ni « accès interdit » ni la relance après erreur** (2 des 6 états
  de la fiche). Ajout de l'état `forbidden` et d'une action « Réessayer » sur l'erreur
  récupérable, avec un test unitaire de `MembersPage` qui pilote ces états par un port
  contrôlable (chargement, erreur + relance, 403).
- **`VerificationBadge` : `id` de panneau statique** → identifiants dupliqués dès deux
  badges sur une page. Rendu unique par instance (WCAG 4.1.1/4.1.2).
- **Garde anti-piège-de-focus de `InlineErrorSummary` non testée** → ajout d'un test
  N→M sans re-focus et d'un test de cycle, éprouvés par mutation.
- **`ToastOutlet`, badge, variants `card`/`chart` du Skeleton non couverts** → specs
  ajoutées ; le routage polite/assertif des toasts est éprouvé par mutation.

Réfutés à bon droit (exemples) : l'état « première utilisation » sans bouton propre
(l'action primaire « Nouveau membre » de l'en-tête domine déjà la zone — dupliquer
violerait « une seule action primaire par zone ») ; le texte générique de l'état
`forbidden` (aucun lien ni destination inventée, donc hors du champ d'UX-DEC-011).

Total après corrections : **78 tests unitaires + 672 Playwright**, tous verts hors
baselines visuelles délibérément non générées.

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

## 9. Backend — module ADM « reference-values » (l'étalon)

Premier module métier implémenté de bout en bout, choisi comme étalon (plan LOT 3.d) :
petit, sans dépendance entrante, sur un domaine sans enjeu financier. Il valide la
chaîne complète **contrat OpenAPI typé → JPA → Flyway → service `@PreAuthorize` +
test négatif 403 → réponses `Problem` normalisées**.

| Élément | Détail |
|---|---|
| Route | `GET /reference-values` (`listReferenceValues`), filtre `domain`, pagination bornée |
| Contrat | Schémas `ReferenceValueView` / `ReferenceValuePage` typés, `additionalProperties: false` (fin de l'`additionalProperties: true` sur cette route) |
| Architecture | Hexagonale : `domain` / `application` / `adapter.in.web` / `adapter.out.persistence` ; l'entité JPA ne franchit pas l'API |
| Autorisation | `@PreAuthorize("hasRole('ADMIN_FONCTIONNEL')")` au service (ADR-008), seul rôle porteur d'`ADMIN.REFERENTIAL.READ` dans V3 |
| Tests | 41 backend verts, dont 9 pour ce module + la vérification des frontières Spring Modulith ; le 403 est éprouvé par mutation |

### Audit indépendant du module (non-auto-validation)

Quatre réviseurs backend spécialisés (sécurité, architecture, contrat d'API, tests),
puis deux sceptiques par constat. **18 constats soumis : 9 confirmés, 9 réfutés.** Les
9 confirmés corrigés dans le même incrément :

- **Les erreurs 400 de validation ne respectaient pas le format `Problem`** et le
  `Content-Type` des erreurs était `application/json` au lieu de `application/problem+json`.
  Ajout d'un `ApiExceptionHandler` (400 typé avec `code` + `correlationId`), correction
  du `Content-Type`, et d'un `CorrelationIdFilter` qui garantit `X-Correlation-Id` sur
  **toute** réponse — succès comme erreur. C'est l'infrastructure transverse que
  l'étalon devait fixer une fois pour toutes.
- **Absence de garde-fou des frontières de modules** → test `ApplicationModules.verify()`
  ajouté (Spring Modulith).
- **Tests renforcés** : pagination effective (page 0 vs page 1, ordre stable), contenu
  réel des valeurs semées, bornes basses (page négative, taille nulle), corps `Problem`
  des 400/401/403.

Réfutés à bon droit : le `@PreAuthorize` par nom de rôle plutôt que par code de
permission (choix assumé d'ADR-008) ; le décodeur JWT factice des tests (bypassé par le
post-processeur `jwt()`, sans incidence sur la configuration réelle).

Ce que ce module NE livre PAS : les écritures `createReferenceValue` / `updateReferenceValue`
(idempotence + audit + verrou optimiste), prochain incrément backend. Les référentiels
« secteur d'activité » et « région » restent absents du seed (DATA-DEC-002 tient : les
filtres BO-002 correspondants ne sont toujours pas alimentés).


### Écritures ADM : createReferenceValue (idempotence + audit)

Deuxième incrément backend : le chemin d'écriture de l'étalon, qui pose les patrons
que tout futur module financier réutilise — autorisation d'écriture, idempotence,
événement d'audit transactionnel, conflit d'état.

| Élément | Détail |
|---|---|
| Route | `POST /reference-values`, contrat typé `ReferenceValueInput` (`additionalProperties: false`) |
| Idempotence | Par clé naturelle (domaine, code) faute de magasin de clés (DATA-DEC-005) : rejeu identique → 200, contenu divergent → 409, `Idempotency-Key` exigé (400 si absent) |
| Audit | Module `audit` (Spring Modulith) : chaque création écrit un événement corrélé dans `audit.audit_event` (append-only), avec empreinte SHA-256, **dans la même transaction** |
| Erreurs | 400/409 au format `Problem` (`STATE_CONFLICT`, `VALIDATION_ERROR`), `application/problem+json`, `X-Correlation-Id` sur toute réponse |
| Frontières | `shared` déclaré module OPEN (noyau partagé) ; `administration → audit` ; `ModularityTest` vert |
| Tests | 49 backend verts (17 pour ADM) ; les gardes @PreAuthorize et audit éprouvées par mutation |

Audit indépendant du write-path : 15 constats, **6 confirmés, 9 réfutés**. Corrigés :
absence de second audit sur rejeu idempotent et sur conflit désormais vérifiée ;
longueur minimale de `Idempotency-Key` testée ; acteur d'audit = sujet Keycloak
vérifié. **Signalé, non corrigé (prochain incrément sécurité, ADR-008) :** aucun
événement d'audit n'est émis sur un refus 401/403 — le chemin de succès est audité,
le chemin de refus reste à câbler dans `SecurityConfig` (`audit.security_event`).

Non livré : `updateReferenceValue` (verrou optimiste), et le magasin de clés
d'idempotence générique (DATA-DEC-005) — à trancher avant les modules financiers.


### CRUD ADM complet : updateReferenceValue + audit des refus

Troisième incrément backend : la mise à jour sous verrou optimiste et la trace des
refus d'autorisation. Le module ADM offre désormais un CRUD complet (list, create,
update), l'étalon de bout en bout.

| Élément | Détail |
|---|---|
| Route | `PATCH /reference-values/{id}`, contrat `ReferenceValueUpdate` typé, `version` exposée dans la vue |
| Verrou optimiste | Double protection : contrôle `If-Match` vs version courante (409 avant tentative) **et** `@Version` JPA au flush (409 sur course réelle) ; PATCH réellement partiel ; corps vide = no-op sans audit |
| Not-found | `RESOURCE_NOT_FOUND` (404) au format `Problem` |
| Audit des refus | Un **403** écrit un événement `AUTHORIZATION_DENIED` dans `audit.security_event` (best-effort) — ferme la limite d'ADR-008 ; le 401 anonyme reste non audité (volume/signal) |
| Tests | 59 backend verts (27 ADM) ; les gardes version et audit-de-refus éprouvées par mutation |

Audit indépendant : 21 constats, **8 confirmés, 13 réfutés**. Corrigés : la
contradiction ADR-008 (documentait le refus comme non audité alors qu'il l'est)
**redressée dans l'ADR et le scorecard** ; `If-Match` non numérique désormais rendu
au format `Problem` ; PATCH vide traité en no-op sans audit fantôme ; tests ajoutés
(PATCH partiel, no-op, libellé vide, absence d'audit sur version obsolète). Réfutés à
bon droit : dépendance `shared → audit`, non-audit du 401, absence de corrélation
dans l'événement de sécurité (enrichissement documenté).

Non livré : magasin de clés d'idempotence générique (DATA-DEC-005) et enrichissement
de l'événement de sécurité (IP source, corrélation) — avant les modules financiers.


### Autorisation par permission + module MEMBER (listOrganizations)

Quatrième incrément backend : le modèle d'autorisation par permission (le blocage que
posait tout endpoint multi-rôle) et le premier écran de données réelles côté MEMBER.

| Élément | Détail |
|---|---|
| Permissions dérivées | Les rôles de realm sont dérivés en autorités `PERM_*` depuis `iam.role_permission` (`PermissionDirectory`, cache mémoire) ; `@PreAuthorize("hasAuthority('PERM_MEMBER.READ')")` remplace l'énumération fragile de ~14 rôles. ADR-008 mis à jour (§3bis) |
| listOrganizations | `GET /organizations` typé (`OrganizationView`/`OrganizationPage`), filtres status/type/secteur, recherche (métacaractères LIKE échappés), tri borné (liste blanche + départage stable), pagination |
| Frontières | Nouveau module `member` ; `PageResult` générique remonté dans `shared` (ADM migré dessus) ; `ModularityTest` vert |
| Montants exclus | Les montants de cotisation (dues/payées de BO-002) restent hors MEMBER — `modules.md` l'interdit tant qu'ADR-006 (read-model) n'est pas promue |
| Tests | 78 backend verts (15 MEMBER + 6 dérivation de permission) ; garde `@PreAuthorize` éprouvée par mutation |

Audit indépendant : 13 constats, **7 confirmés, 6 réfutés**. Corrigés : métacaractères
LIKE échappés ; dérivation testée à travers le **bean réellement câblé** (pas une
instance manuelle) ; contrôle négatif (un rôle sans `MEMBER.READ` ne l'obtient jamais) ;
tests filtre secteur, tri par statut, aucun-résultat, borne exacte, repli de tri.
Réfutés à bon droit : cache sans invalidation (seed quasi statique), SQL brut dans
`shared`, ADM resté role-based (1 seul rôle).

**Limite documentée (ADR-008) :** l'ABAC (périmètre organisation/groupement) n'est pas
appliqué — un rôle scopé voit toutes les entreprises. Il suppose un périmètre porté par
le jeton (provisionnement Keycloak), à câbler avant exposition en production.

Non livré : la vue membre complète de BO-002 (jointure adhésion + groupement + contact),
`listMemberships`, et les montants (ADR-006) — prochains incréments MEMBER.


### Vue « membre » de BO-002 : listMemberships (jointure adhésion↔entreprise)

Cinquième incrément backend : l'opération qui donne à BO-002 ses colonnes réelles
(code d'adhésion, raison sociale, catégorie, statut), en joignant `member.membership`
à `member.organization`.

| Élément | Détail |
|---|---|
| Route | `GET /memberships` typé (`MembershipView`/`MembershipPage`), jointure vers l'entreprise |
| Requête | Fetch join anti-N+1 (garde contre la requête de comptage) ; filtres statut/catégorie ; recherche sur numéro OU raison sociale (métacaractères LIKE échappés) ; tri borné (numéro, statut, nom d'entreprise) avec départage stable par id ; pagination |
| Autorisation | `PERM_MEMBER.READ` (permission dérivée) ; 403/401 testés |
| Tests | 91→95 backend verts (15 pour listMemberships) |

Panel d'experts seniors (DBA, correction, architecture, testeur) + deux sceptiques par
constat : 11 soumis, **4 confirmés, 7 réfutés**. Corrigés : couverture du tri complétée
— tri par numéro et par statut, repli sur clé non autorisée, départage stable éprouvé
par pagination sur clé à valeurs répétées. Réfutés à bon droit : échappement LIKE
correct, cast Fetch→Join sûr, N+1 évité, limite ABAC documentée.

Ce qu'il reste pour un BO-002 100 % réel : le groupement (jointure `group_membership`)
et le contact principal, puis le câblage du gateway Angular sur l'API (backend + auth
Keycloak). Les montants dus/payés restent bloqués (ADR-006, modules.md).


### Seed de la nomenclature institutionnelle réelle (V6)

Sixième incrément : la migration `V6__seed_regions_and_professional_groups.sql` sème la
nomenclature réelle du CNPM, désignée par le commanditaire depuis son site officiel
`cnpm.ml`. Débloque partiellement DATA-DEC-002 (filtres Région et Groupement de BO-002).

| Élément | Détail |
|---|---|
| Régions | 7 Conseils Patronaux de Région dans `ref.reference_value` domaine `REGION` (Kayes → Tombouctou) |
| Groupements | 39 groupements professionnels dans `member.professional_group` (sigle + dénomination) |
| Nature | Structure **publique** du CNPM ; aucune donnée confidentielle de membre, aucun contact personnel de président de CPR |
| Idempotence | `ON CONFLICT (domain, code)` / `ON CONFLICT (code)` `DO NOTHING` : rejouable, ne réécrit jamais l'existant |
| Tests | 4 cas (`NomenclatureSeedTest`) : présence, libellés non vides, idempotence + non-écrasement, application depuis V5 ; 9 verts avec `FlywayMigrationTest` |

Audit indépendant (database-reviewer) : **verdict APTE À COMMITTER, aucun défaut
bloquant**. Idempotence, conformité au schéma (longueurs, apostrophes françaises
échappées), absence de données personnelles, absence de collision avec le seed V3 et
réversibilité toutes vérifiées. Deux renforcements de test mineurs appliqués
(non-écrasement de `ref.reference_value`, étape explicite V5→V6) et la traçabilité
gouvernance complétée (DATA-DEC-002).

Quatre points laissés à l'arbitrage CNPM (migration immuable → correction par V7 le cas
échéant), tous consignés dans DATA-DEC-002 : libellé **GCM** (extraction dupliquée,
réduit au sigle), libellé **AEPES** (non publié, réduit au sigle), **taxonomie de
secteurs** absente (`sector_code` laissé `NULL`, filtre Secteur toujours non rendu),
statut du **District de Bamako** (8ᵉ entité régionale ?) non tranché.

Restent bloqués côté BO-002 : filtres Secteur d'activité, Niveau de cotisation (DEC-008)
et Période d'adhésion.


### BO-002 : groupement principal dans listMemberships (vue de lecture V7)

Septième incrément : la colonne « Groupement » de BO-002, alimentée par une vue de
lecture `member.membership_list` qui résout le groupement professionnel **principal** de
chaque adhésion. S'appuie sur les 39 groupements réels semés en V6.

| Élément | Détail |
|---|---|
| Vue | `member.membership_list` (V7) : aplatit adhésion + entreprise + groupement principal ; `LEFT JOIN LATERAL ... LIMIT 1` retient un seul rattachement principal actif (le plus récent, départagé par `group_id`), même en l'absence de contrainte d'unicité sur `is_primary` |
| Lecture sans N+1 | Une ligne par adhésion, colonnes scalaires : plus de fetch join ni de cas spécial comptage ; l'adaptateur (réécrit) filtre/trie/pagine sur la vue |
| Champs | `primaryGroupCode` / `primaryGroupName` (nullables) ajoutés au domaine, à la vue web et au contrat OpenAPI ; nouveau filtre `groupCode` ; tri `primaryGroupName` |
| Modèle de lecture | Vue **intra-module** (ne joint que le schéma `member`, aucun montant) : ne relève pas d'ADR-006 (read-model transverse de reporting), confirmé par l'audit architecture |
| Tests | 105→109 backend verts (25 pour listMemberships), dont groupement exposé, absent→null, rattachement clôturé exclu, **non-principal exclu**, filtre `groupCode` (nominal + 0 résultat), tri par groupement, choix déterministe si plusieurs principaux, unicité de ligne si dates égales |

Panel d'experts seniors (DBA, architecture, testeur, contrat d'API) + vérification
adversariale : **DBA APTE**, **architecture APTE**, **contrat APTE**, **tests NON** au
premier tour. Corrigés : les 2 lacunes HAUTES de test (rattachement `is_primary=false`
ignoré — cible la condition `AND gm.is_primary` de la vue ; contrôle négatif du filtre
`groupCode`), la lacune MOYENNE (unicité de ligne à dates égales), le négatif de longueur
`groupCode`, les commentaires de colonnes de la vue, et la traçabilité (data-model.md +
présente section). Réfutés / confirmés sûrs : unicité de ligne garantie par le `LIMIT 1`
(vérifié empiriquement à 100 000 lignes), déterminisme du départage garanti par l'index
`uq_member_group_membership_active`, échappement LIKE et Specification paramétrée sûrs,
`ddl-auto=validate` accepte la vue, aucune frontière de module ni donnée financière
franchie.

**Réserve de performance consignée (DATA-DEC-006).** Le tri `primaryGroupName` sur une
colonne dérivée de la LATERAL, sans filtre sélectif, coûte ~1 s à 100 000 adhésions
(mesuré). Non bloquant à l'échelle réelle du CNPM (non chiffrée), consigné comme décision
ouverte plutôt que sur-optimisé prématurément.

Non livré : le contact principal de l'entreprise (dernière colonne BO-002), `getOrganization`
détail, et les écritures `createOrganization`/`createMembership`. Les montants dus/payés
restent bloqués (ADR-006, modules.md).
