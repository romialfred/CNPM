<!-- Plan d'implémentation consolidé.
     Produit par analyse des sources du dépôt (écrans, maquettes, composants, backlog,
     modèle de données, contrats API) et arbitrage de synthèse.
     Ce document est opérationnel : il prime sur toute planification antérieure ad hoc,
     et reste subordonné à PLANS.md et à la hiérarchie de source-of-truth.md. -->

# PLAN D'IMPLÉMENTATION UNIQUE — Plateforme CNPM

*Directeur de programme technique — arbitrage de synthèse. Ce plan remplace les trois notes d'angle.*

---

## 1. Objectif de mission (3 lignes)

Construire la plateforme Web et mobile du Conseil National du Patronat du Mali — enrôlement, cotisations, paiements, reçus, recouvrement, portail membre et vitrine publique — strictement conforme aux sources de vérité du dépôt.
Livrer d'abord les **4 écrans pilotes R0** (`AUTH-001`, `PUB-001`, `PUB-006`, `BO-002`) **fidèles à leurs fiches normatives et à leurs maquettes**, sur un socle réutilisable.
Ne jamais inventer une règle métier, un taux, une permission, une donnée officielle ou un actif de marque : là où la source manque, on ne rend pas la section, et on le prouve par un test.

---

## 2. État réel à date — sans complaisance

### Ce qui est fait, et tient

| Domaine | État vérifié |
|---|---|
| Toolchain | JDK 25, Maven, Node 24, Flutter 3.44 — validés |
| Backend | Compile ; **31 tests verts** ; Flyway V1→V5 ; append-only + garde TRUNCATE couvrant **19/19 tables** ; `numeric(19,2)` et interdiction du flottant tenus (`FinancialColumnTypesTest`) |
| Plateforme locale | PostgreSQL, Keycloak, RabbitMQ, Valkey démarrent |
| Sécurité runtime | Authn/authz refus par défaut ; `ADR-008` écrit et lucide sur ses propres limites |
| Design system | 11 composants du catalogue + 1 hors catalogue ; couche `ui-contracts/` (bonne pratique déjà en place) |

### Ce qui n'est pas fait — et le reproche du commanditaire est fondé

**Les 4 écrans pilotes : 1 conforme sur 4.**

| Pilote | État réel | Cause |
|---|---|---|
| `AUTH-001/002` | « Fait », **non conforme à sa fiche** | Les 5 composants d'état (`Skeleton`, `EmptyState`, `ErrorState`, `Toast`, `InlineErrorSummary`) n'existent pas ; `PublicShell` non plus. Défaut a11y **MAJEUR ouvert** (UX-DEC-012). |
| `PUB-006` | « Fait », **pauvre** | Sa fiche exige 13 composants ; les fixtures n'en alimentent que 6. **Ce n'est pas un défaut d'implémentation.** |
| `PUB-001` | Non fait | **10 de ses 11 composants sont hors catalogue** ; 6 sections sans fixture ; aucune API publique n'existe ; **aucune exigence, aucune story, aucun cas de test**. |
| `BO-002` | Non fait | **Le seul des quatre qui soit intégralement faisable aujourd'hui.** Maquette + fiche + fixtures + rôles + zéro décision bloquante. Il aurait dû être le premier. |

**Les cinq faits structurants qui expliquent le retard :**

1. **Le contrat OpenAPI ne contraint rien.** 77 opérations, 7 schémas, **101 références à `Resource`** dont le corps est `attributes: {additionalProperties: true}`. `Money` : **défini, référencé 0 fois** — le contrat ne sait transporter aucun montant. `DecisionInput` (avec `reason` requis) : **0 référence** sur 8 opérations de décision. `in: query` : **2 occurrences sur 77** (`page`, `size`) — **aucune collection n'est filtrable**. `security:` : **1 seule occurrence, en racine** — **aucun endpoint public n'existe**. `CLAUDE.md` dit « le contrat OpenAPI précède l'implémentation » ; ce contrat ne précède rien. Symptôme déjà visible : `CurrentUserController` ne respecte pas son propre contrat.
2. **Aucun des 4 shells n'existe** (`AdminShell`, `MemberPortalShell`, `PublicShell`, `MobileAppShell`) — ils conditionnent **49 des 56 écrans P0**. `PublicShellComponent` actuel est un cadre ad hoc de 2 liens, pas `LAY-003`.
3. **52 des 135 mentions de composants dans les 14 fiches désignent des noms absents du catalogue de 74.** Les fiches écran et le catalogue ne partagent pas un vocabulaire unique. `component-catalog.md:88` interdit d'utiliser une variante non catalogée.
4. **Aucun Storybook** (`web/.storybook` inexistant, aucune dépendance) et **un seul spec** dans tout le design system. Le catalogue impose story + tests d'interaction + tests axe + capture pour **chaque P0** : **10 des 11 composants livrés y dérogent**.
5. **Gouvernance en dérive.** DEC-013 est **fermée depuis le 2026-07-16** ; son travail induit n'est pas fait : les 144 stories, `release-plan.md` et `traceability-matrix.csv` portent encore l'ancienne taxonomie. `open-decisions.md:138-145` : *« aucune affirmation d'appartenance d'une story à une release n'est fiable »*. Les 4 pilotes R0 de `PLANS.md` sont **introuvables dans le backlog** (grep → 0).

### Deux corrections de périmètre à acter

- **101 écrans, pas 105.** Trois sources concordantes (`screen-inventory.md:3`, `README.md:5`, `screen-inventory.json`). **P0 = 56 confirmé.** Le total de 105 n'est étayé par aucun fichier.
- **UX-DEC-011/012/013 n'existent que dans le registre consolidé** ; `docs/ui-handoff/data/open-decisions.json` s'arrête à UX-DEC-010 et diverge sur les statuts 009/010.

### Le verdict, sans détour

**On ne s'est pas éloigné de la mission par dérive : on a construit des écrans avant leur socle.** AUTH-001 et PUB-006 sont des coquilles parce que les états, les shells et les fixtures manquaient. Reproduire cette séquence sur PUB-001 produirait une troisième coquille. **Le remède n'est pas d'accélérer sur les écrans, c'est de poser le socle en 2 semaines et de livrer BO-002 fidèle — le seul pilote où la fidélité totale est atteignable.**

---

## 3. Le plan par lots

**Deux pistes parallèles dès J1.** Piste **FRONT** (visible en 2 semaines) et piste **BACK** (invisible, bloquante). Les sérialiser, c'est 6 semaines sans rien à montrer ; les fusionner, c'est reproduire le défaut actuel. Elles convergent au LOT 4.

**Échelle :** 1 pt ≈ 1 jour-personne d'un dev confirmé sur ce dépôt, **tests, story Storybook et captures compris**. Ordres de grandeur comparatifs, pas engagement contractuel.

---

### LOT 0 — Arbitrages à coût nul *(parallèle permanent, 0 pt dev)*

**Objectif.** Fermer ce qui ne dépend d'aucun tiers et bloque tout le reste. Ce lot consomme des réunions, pas du dev. Il démarre à J0 et **ne doit jamais être sur le chemin critique d'un lot de code**.

**Contenu**

| # | Décision | Pourquoi maintenant |
|---|---|---|
| 0.1 | **UX-DEC-009** — icônes (Lucide proposé, échéance « Sprint 0 ») | Bloque `IconButton`, toute la navigation, `iconStart`/`iconEnd`. `status.contract.ts` référence **déjà** `circle-check`, `clock-3`, `user-plus`, `circle-pause` **sans jeu décidé** : la dette est contractée. |
| 0.2 | **UX-DEC-012** — `tablist` vs `radiogroup` | Défaut a11y **MAJEUR** sur un écran déclaré fait. Recommandation technique déjà écrite (`open-decisions.md:79`). Préalable à `RadioGroup`. |
| 0.3 | **UX-DEC-010** — seuils de régression visuelle | Toute baseline créée avant est à refaire. Viewport de référence fixé : **VP-1672 (1672×941)**. |
| 0.4 | **Vocabulaire des 52 composants hors catalogue** | Trancher : désignation d'usage (`TextInput email` = FRM-001) vs vrai composant à inscrire (`Hero`, `PublicFooter`, `AuditTrail`, `InstallmentTable`, `ActionList`…). Sans cela chaque écran réinvente ses noms. |
| 0.5 | **Extension des fixtures** | Quelles sections fictives ajouter, lesquelles restent **structurellement non rendues** (§6). |
| 0.6 | **Modèle vitrine : plat vs `sections[]`** | `member-showcase.schema.json` (plat, sans `SUSPENDED`) et `api-addendum.yaml` (`sections[]`, avec `SUSPENDED`) **ne peuvent pas être vrais simultanément**, alors que `requirements.md:48` impose `PUBLISHED → SUSPENDED`. **Bloquant pour toute extension de la fixture vitrine.** |
| 0.7 | **Remappage DEC-013** | 144 stories + `release-plan.md` + `traceability-matrix.csv`. 5 ambiguïtés à arbitrer (10 stories ADM/INT non couvertes par `PLANS.md` ; TEC-006/007/008/012 et DB-013/014 revendiqués par R0 **et** R5 ; SEC-001/003 entre R0 et R1 ; **R4 sans aucune story** ; **mobile sans aucune story**). |
| 0.8 | **Resynchroniser `open-decisions.json`** | UX-DEC-011/012/013 absents ; statuts 009/010 divergents. |

**Décisions à créer — 10 trous non tracés aujourd'hui :** partenaires (vérification du claim, consentement du tiers) · témoignages (consentement, retrait, responsabilité) · newsletter (base légale, prestataire) · textes institutionnels publics · formats RCCM/NIF (**0 occurrence** dans `data-model.md` et `openapi.yaml`) · seuil de similarité MEM-002 · masque de l'identifiant CNPM · groupements réels du CNPM · règles d'arrondi · produit antivirus. Plus : **clarifier la portée de DEC-005** (couvre-t-elle US-AUD-003 « export **signé** » ou seulement les reçus ?).

**Escalades à lancer à J0** (elles ne se débloqueront pas seules) : **DEC-002/003/005/008** (finance, toutes *Critique*) → LOT 10. **UX-DEC-011 (BLOCKED)** → LOTS 1, 8. **UX-DEC-013** → LOT 11.

**Critère de sortie.** 0.1 à 0.6 fermées et datées ; 0.7/0.8 exécutées ; 10 décisions ouvertes tracées ; entrée de catalogue écrite pour chaque nom retenu en 0.4.
**Preuve.** `open-decisions.md` et `open-decisions.json` alignés ; backlog remappé R0–R5 ; ADR pour 0.4 et 0.6.

---

### LOT 1 — Socle UI transverse + `PublicShell` *(10 pts — piste FRONT)*

**Objectif.** Rendre **conformes à leur propre fiche** les écrans déjà livrés, et poser les briques que les 14 fiches exigent **toutes, sans exception**.

**Le défaut à solder d'abord.** Les 14 fiches portent la même règle commune : *couvrir chargement, vide, aucun résultat, erreur, accès interdit, session expirée*. `loading-empty-error.md` en fait une matrice de 10 états et pose la règle dure : **« Ne jamais afficher une page blanche ou un spinner indéfini. »** Aucun des 5 composants correspondants n'existe. **C'est le premier passif, avant tout écran neuf.**

**Écrans.** **AUTH-008** (`/auth/session-ended`, P0, non bloqué) livré intégralement. **AUTH-001/002** repris sur `PublicShell minimal` (la fiche l'exige nommément) + correction UX-DEC-012. **PUB-006** reposé sur vraie shell, sections vides converties en **non-rendu testé**.

**Composants (14).** États : `Skeleton` FDB-005 (fidèle à la structure, `aria-hidden` + statut), `EmptyState` FDB-006 (**« aucun résultat » ≠ première utilisation**), `ErrorState` FDB-007 (`recoverable, forbidden, not-found, offline`), `Toast` FDB-003 (**une notification critique ne dépend jamais d'un seul toast**), `InlineErrorSummary` FDB-004 (reçoit le focus). Primitives : `Section` LAY-006, `Card` LAY-007, `PageHeader` LAY-005, `Link` ACT-005, `IconButton` ACT-002, `Breadcrumb` NAV-005. Shell : `PublicShell` LAY-003 (`transparent, solid, menu-open`, header/nav/footer sémantiques, skip-link), `PublicHeader` NAV-003 (`aria-expanded`), `PublicFooter` *(hors catalogue → 0.4)*.

**Dettes du design system à solder ici — elles coûtent 10× plus après 40 écrans**

| Dette | Détail |
|---|---|
| **`badge.component.ts` contredit sa propre couche de contrats** | Expose `tone: 'critical'` ; FDB-001 exige `error` ; `status.contract.ts` définit `'neutral'\|'info'\|'success'\|'warning'\|'error'` |
| **3 noms pour un besoin** | `OfflineNotice` (hors catalogue), `OfflineBanner` (demandé par MOB, hors catalogue), `ErrorState.offline` (FDB-007). Unifier |
| `Checkbox` sans `indeterminate` | État FRM-007 obligatoire — requis par `BulkActionBar` au LOT 4 |
| `iconStart`/`iconEnd` | Déclarés dans `CnpmButtonProps`, non implémentés. Dépend de 0.1 |
| Variante `Ghost` | Documentée dans `buttons-actions.md`, absente de `button.contract.ts` |
| `table.contract.ts` ajoute `datetime` | Absent de `CnpmColumn<T>` documenté. Extension non consignée |
| **Storybook** | À installer. La règle P0 du catalogue est aujourd'hui violée par 10 composants sur 11 |

**Règles à câbler dans les composants, pas dans les écrans.** `buttons-actions.md` : `sm` 36 / `md` 40 / `lg` 44 px, mobile primaire 48 px ; **une seule action primaire par zone** ; `loading` **conserve la largeur** + `aria-busy` ; ordre FR desktop **secondaire à gauche, primaire à droite** ; **jamais deux boutons rouges côte à côte**. `localization-formatting.md` : locale **`fr-ML`** ; **jamais float** ; `12 500 000 FCFA` **ou** `XOF`, sans mélange dans un même écran ; zéro = `0 FCFA` ; dates `27/05/2024` (dense) / `27 mai 2024` (éditorial).

**Backend.** Aucun.

**Décisions bloquantes.** **UX-DEC-011 (BLOCKED)** → aucun lien récupération/support ; les emplacements restent en commentaire dans `login.page.html` / `verify.page.html` — **les laisser ainsi, ne pas « améliorer »**. **UX-DEC-002** (logo) → `assets/placeholders/company-logo-placeholder.svg`, **déjà versionné**. **UX-DEC-001** (police) → ne pas figer de baseline « définitive ».

**Critère de sortie.** AUTH-008 livré avec ses 10 états ; AUTH-001/002 et PUB-006 passent leur propre fiche ; Storybook opérationnel ; 14 composants × (story + test d'interaction + test axe + capture).
**Preuve.** `npm ci && npm run lint && npm test -- --watch=false && npm run build` ; **0 violation axe critique/sérieuse** ; captures sur les 8 viewports de `data/viewports.json`, animations désactivées, locale `fr-ML`, date fixe ; **test négatif verrouillant le non-rendu de chaque section absente de PUB-006** ; test de non-régression `critical` → `error`.

---

### LOT 2 — PUB-001 Accueil public *(7 pts — piste FRONT)*

**Objectif.** La première page que verra le commanditaire. **Livraison partielle assumée et documentée, pas retard indéfini.**

**Pourquoi ici et pas plus tard.** C'est un pilote R0 et la porte d'entrée institutionnelle. Contrairement à PUB-006, **son ossature est livrable de bout en bout** : une accueil sobre sans bandeau partenaires reste une page institutionnelle crédible. PUB-006 sans galerie ni preuve sociale est amputé de sa raison d'être ; PUB-001 sans elles ne l'est pas.

**Composition, fidèle à `ref-pub-001-public-home.md` (pas au PNG).** Conteneur **1440 px max** ; sections **80–112 px** sur grand desktop ; hero grille **6/6**, texte+CTA à gauche, média à droite ; ordre mobile **imposé** : titre → proposition → CTA → preuve courte → image ; **titre et CTA visibles sans scroll à 1440×900** ; **aucun carrousel automatique** ; **contenu lisible sans images**.

**Livrable, section par section**

| Rendu | `PublicHeader`, `Hero` structurel, `Metric strip`, `Button public CTA`, `PublicFooter` |
|---|---|
| **Non rendu, testé absent** | `Feature grid`, `Module links`, `News cards`, `Testimonial`, `Partner logos`, `Newsletter form` |

⚠️ **10 des 11 composants de cette fiche sont hors catalogue** — l'écart le plus lourd du pack. Le catalogue ne porte que `PublicHeader`. Dépend de **0.4**.

**Backend : aucun dans ce lot, et c'est un choix documenté.** La fiche exige « les chiffres clés viennent d'une **API publique** mise en cache et **affichent leur date de mise à jour** ». Trois faits : (a) **aucun endpoint public n'existe ni ne peut exister** (`security:` en racine uniquement ; `getDashboard` est taggé `REPORT` et hérite d'`oauth2`) ; (b) la fixture `kpis` porte les 12 valeurs **sans date de mise à jour** ; (c) **PUB-001 est P0 sans aucune exigence** — pas de préfixe `PUB` dans `requirements-catalog.md`, `grep "PUB-001"` sur `docs/01-product/` → **0**. Créer l'endpoint reviendrait à **inventer un périmètre**.
→ Bande de chiffres alimentée par un **`PublicStatsGateway` de démonstration**, sur le modèle exact de `demo-showcase.gateway.ts`, avec `dataAsOf` ajouté à la fixture et affiché. Le port est écrit contre le contrat cible ; l'adaptateur réel arrive quand le LOT 3 rend l'endpoint possible **et** que la gouvernance le rend légitime.

**CTA.** Adhésion → PUB-012, portail → AUTH-001, annuaire → PUB-004. **PUB-012 et PUB-004 n'existent pas** → les CTA concernés ne sont pas rendus tant que la destination n'existe pas. **Jamais de lien inerte** — la règle est déjà correctement appliquée par le `PublicShellComponent` actuel. Le CTA portail est rendu.

**Décisions bloquantes.** **Textes institutionnels** (*à créer*, 0.4) → clés `ui-copy.fr.json` marquées `TODO-COPY` ; **la voix institutionnelle du CNPM n'est pas au code de l'écrire**. UX-DEC-002 (logo), UX-DEC-003 (photothèque) → hero avec `image-placeholder.svg` ; la fiche PUB-006 pose la règle applicable : *« placeholder neutre, pas d'image générée en production »*. UX-DEC-007 (langues).

**Dire les choses : PUB-001 ne sera pas fidèle à sa maquette, et le débloquer ne suffirait pas.** `Partner logos` exigerait des **marques de tiers** — `CLAUDE.md` interdit sans réserve d'inventer un partenaire ou un actif de marque. `Testimonial` et `Newsletter form` n'ont ni données, ni contrat, ni décision. La fidélité atteignable est **~40 % de la surface** — soit exactement le profil actuel de PUB-006. **Ce lot livre la colonne vertébrale, pas la maquette.** Prétendre l'inverse serait mentir.

**Critère de sortie.** 5 sections rendues aux 8 viewports ; 6 sections avec assertion négative ; `dataAsOf` affiché.
**Preuve.** Test « titre + CTA sans scroll à VP-1440 » ; test « page lisible images désactivées » ; **6 tests négatifs de non-rendu** ; axe 0 critique/sérieux ; zoom 200 % et reflow à 320 px.

---

### LOT 3 — Contrat OpenAPI typé + socle sécurité/audit *(12 pts — piste BACK, démarre à J1 en parallèle des LOTS 1-2)*

**Objectif.** Rendre le contrat contraignant, et poser l'audit **avant** les modules métier. **Blocage n°1 du programme.**

**3.a — OpenAPI (aucun ordre interne, tout avant le LOT 4)**

1. **Typer les schémas R0** : `CurrentUser`, `MemberSummary`, `MemberDetail`, `MembershipView`, `ReferenceValueView`, `PageResource<T>`. Supprimer `additionalProperties: true` sur ces routes.
2. **Câbler `Money`** (le schéma est correct : `pattern: ^-?\d{1,17}(\.\d{1,2})?$` — il est simplement inutilisé) sur tout montant.
3. **Câbler `DecisionInput`** sur les 8 opérations de décision → `reason` devient obligatoire. Aujourd'hui elles acceptent `ResourceInput`, **sans motif** — contre les règles d'audit.
4. **`security: []`** sur les routes publiques ; **corriger `verifyReceipt`**, dont le résumé dit « Vérifier **publiquement** » mais qui déclare 401/403 — contradiction contrat↔contrat **et** contrat↔ADR-008 (qui l'inclut en liste blanche).
5. **Filtres / recherche / tri** sur `listOrganizations` et `listMemberships` — sans quoi BO-002 est inservable.
6. **Différencier `Idempotency-Key`** (`required: true` uniforme, `openapi.yaml:3504-3511`) : requis sur flux financiers et callbacks, optionnel ailleurs.
7. **Traçabilité** : `x-requirements` sur `getCurrentUser` et `requestStepUp` (**seules 2 opérations sur 77 sans bloc**) ; statuer sur le tag **`SECURITY` déclaré et porté par 0 opération** alors que la matrice y renvoie SEC-001..005 — **la matrice pointe vers un tag vide** ; resserrer les `x-requirements` grossiers (`listOrganizations` déclare MEM-001..008, dont MEM-006 « carte QR » et MEM-007 *Could*).
8. **Documenter la délégation du login à Keycloak** — déduite d'ADR-003 + absence d'opération, **écrite nulle part dans `docs/04-api/`**.

> **Modèle de référence à portée de main :** `docs/12-member-showcase/api-addendum.yaml` est **de bien meilleure qualité que l'OpenAPI canonique** — schémas typés, `Slug` avec pattern, sécurité par opération, `security: []` sur `/public/members`. **Le savoir-faire existe déjà dans le dépôt ; il est simplement dans le mauvais fichier.** S'en servir comme gabarit.

**3.b — Architecture**

- **Trancher l'accès transversal aux montants de BO-002 — le point le plus coûteux, documenté nulle part.** La fiche exige des montants FCFA par membre ; les fixtures portent `due`/`paid`. Ces montants vivent dans `contribution.*` et `payment.*` — **schémas d'autres modules**. `modules.md:27` interdit à MEM de les lire. Trois issues : promouvoir **ADR-006** (read-model, *Proposée*) en *Acceptée* ; endpoint porté par COT ; ADR d'exception. **Bloquant pour BO-002 complet.**
- **Promouvoir ADR-003 (Keycloak) et ADR-005 (S3)** de *Proposée* à *Acceptée* : du code en dépend déjà. Les ADR-001→007 sont des coquilles au « Contexte » et aux « Conséquences » **identiques mot pour mot** ; ADR-003 et 005 doivent au minimum être instruits.

**3.c — Sécurité : fermer les 5 limites qu'ADR-008 énonce lui-même**

| # | Travail | Limite fermée |
|---|---|---|
| 1 | Renseigner `cnpm.security.jwt.expected-audiences` | **L'audience n'est pas vérifiée** — un jeton du même realm pour un autre client passe. À clore avant tout Keycloak réel |
| 2 | Test d'intégration **Testcontainers Keycloak** (signature / émetteur / audience) | *« aucun test d'intégration Keycloak »* |
| 3 | **Module AUD minimal** : `audit.audit_event` + `audit.security_event` en écriture | — |
| 4 | **Événement d'audit sur 401/403** | *« aucun événement d'audit sur 401/403 »* alors que `security-architecture.md` l'exige. Couvre US-AUD-001/002 |
| 5 | Aligner `/auth/me` sur le schéma typé ; ajouter le **périmètre**, pas seulement les rôles | Prépare l'ABAC |
| 6 | **ABAC — périmètre organisation/groupement** | *« non appliqué — seul le RBAC par rôle l'est »*. Validé au LOT 4 sur des lectures, sans effet de bord |

> **Pourquoi AUD ici et pas plus tard.** `CLAUDE.md` : *« Toute action sensible produit un événement d'audit corrélé. »* AUD est dépendance entrante de **tous** les modules suivants. Le construire après MEM et ADM, c'est le rétro-câbler dans chaque contrôleur déjà écrit — et découvrir que les événements des semaines passées ne sont pas reconstituables. **Non-rattrapable.**

**3.d — Module ADM (`ref`) : l'étalon.** `listReferenceValues` / `get` / `create` / `update`. Petit, **aucune dépendance entrante**, déjà seedé par `V3__seed_roles_permissions_and_references.sql`, **il alimente les filtres de BO-002**, et il valide de bout en bout la chaîne **contrat typé → JPA → Flyway → test → `@PreAuthorize` + test négatif 403 → événement d'audit** sur un domaine sans enjeu financier. Si la chaîne casse, elle casse ici, à bas coût.

**Bloqué dans ce lot.** Step-up / MFA (`requestStepUp`) → **UX-DEC-011 (BLOCKED)**. Alertes SMS/e-mail d'US-AUD-004 → **DEC-004** ; **l'alerte in-app et le journal restent livrables** — livrer ceux-là.

**Critère de sortie.** 0 `additionalProperties: true` sur les routes R0 ; `Money` et `DecisionInput` avec ≥ 1 référence ; ≥ 1 route `security: []` ; ADR-006 tranché ; ADR-003/005 *Acceptées* ; ADM livré nominal + négatif.
**Preuve.** `bash scripts/validate-openapi.sh` vert ; `mvn -f backend/pom.xml clean verify` (31 tests toujours verts) ; **génération d'un client typé produisant `MemberSummary` avec `Money`** — impossible aujourd'hui, c'est le test de non-régression du contrat ; test Testcontainers Keycloak ; **test : jeton d'audience étrangère → 401 + `audit.security_event`** ; test : 403 → événement corrélé par `correlationId` ; test d'inaltérabilité du journal ; migration testée **depuis base vide et depuis la version précédente**.

---

### LOT 4 — `AdminShell` + `DataTable` → **BO-002** *(12 pts — convergence FRONT+BACK)*

**Objectif.** Livrer le premier écran **fidèle à sa maquette** du programme.

> **BO-002 est le meilleur premier écran, et il est le seul.** Seul écran à PNG dont les **cinq** conditions sont réunies : maquette (`ref-bo-002-members-list.png`), fiche normative, **fixtures disponibles et cohérentes** (3842 ACTIVE + 1126 DORMANT = 4968 = `membersTotal`, prospects séparés ✅), rôles fixés (`Gestionnaire, Recouvrement`), **aucune décision bloquante**.
> **Levier mesuré :** `AdminShell` conditionne les **38 écrans back-office** (17 P0) ; le gabarit `AdminTable` que BO-002 valide sert **11 écrans** ; `DataTable` est **le composant le plus demandé du pack — 7 fiches sur 14**, contrat déjà amorcé dans `ui-contracts/table.contract.ts`. **Aucun autre incrément n'a ce ratio.**

**Composition normative, valeurs exactes.** `AdminShell` **sidebar 252 px, topbar 72 px, padding 28 px**. En-tête **4 actions max**. Filtres avancés dans **un panneau unique**, **chips actifs sous les contrôles** (pas plusieurs cartes). Tableau **9–10 colonnes** ; densité confortable **52–56 px**, compacte **44–48 px**, en-tête **44–48 px**, **jamais sous 40 px**. Panneau de synthèse **280–300 px** sur grand desktop ; **< 1440 px → drawer** ; **< 768 px → cartes membre**.

**Règles.** Filtres, tri et page **synchronisés dans l'URL** ; debounce **250–350 ms** ; « Réinitialiser » visible **seulement si un filtre est actif** ; nombre de résultats affiché ; **tri des montants et dates sur la valeur, pas le texte formaté** ; sélection groupée à **portée explicite** (page / tous résultats) ; actions de ligne = **Voir, Modifier si autorisé, Historique — la fiche interdit explicitement « trois icônes sans tooltip »** (libellés texte tant que 0.1 n'est pas fermée) ; `caption` + `th scope` + `aria-sort` ; statut par **texte et indicateur**, jamais la couleur seule ; montants **alignés à droite en FCFA** ; retour depuis la fiche **conservant page, filtres et scroll** ; **actifs + dormants = base membres, prospects séparés** ; `aria-current="page"` sur la nav active ; **la ligne entière ne devient pas un lien si elle contient des contrôles**.

**Composants (10).** `AdminShell` LAY-001, `SidebarNavigation` NAV-001, `TopBar` NAV-002, `DataTable` DAT-001, `ResponsiveRecordList` DAT-002, `FilterBar` FRM-013, `SearchField` FRM-012, `Pagination` NAV-008, `BulkActionBar` DAT-004, `Drawer` OVR-002.
`InsightSummary` : **hors catalogue** ; le catalogue porte `InsightPanel` (VIS-004, **P1**) — même objet probable, deux noms, deux priorités → **non rendu**, divergence consignée (0.4).
`StatusBadge` couvert par `badge` **après correction `critical` → `error`** ; `status.contract.ts` matérialise déjà correctement le mapping centralisé exigé.

**Backend.** `listOrganizations` **avec les filtres du 3.a-5** ; `getOrganization` ; `listMemberships` ; `listProfessionalGroups` ; `listReferenceValues` (3.d). **Lectures avant écritures** : BO-002 est un écran de lecture, ce qui permet de valider l'**ABAC** sur des routes sans effet de bord.

**La réserve dure, et l'arbitrage que je pose.**
> Si **3.b** n'est pas tranché à l'ouverture du lot : **livrer BO-002 sans les colonnes de montants plutôt qu'en violant `modules.md:27`.** L'écran reste **entièrement démontrable et fidèle** sur identité, catégorie, groupement, segment, statut, dernière activité, filtres, tri, pagination, sélection groupée, responsive. Les deux colonnes sont ajoutées au LOT 6 dès qu'ADR-006 est promue.

**Fixtures.** Porter `members[]` de **6 à ~25–30 lignes** fictives (mêmes conventions : `.example`, `+223 XX XX XX XX`, raisons sociales inventées). Sans cela **la pagination est inéprouvable** — 6 lignes pour 4 968 membres annoncés. Extension **légitime** : aucun tiers engagé (§6).

**Critère de sortie.** BO-002 avec ses 10 états, aux 9 paliers, **structurellement conforme au PNG à VP-1672**.
**Preuve.** Capture VP-1672 confrontée à `ref-bo-002-members-list.png` — **structure d'abord, pixels ensuite** (`visual-regression.md`) ; captures VP-768 (cartes) et VP-1280 (drawer) ; test « URL restaure filtres + tri + page + scroll » ; test « tri d'un montant sur la valeur, pas la chaîne » ; **test négatif 403 par rôle non habilité** ; axe 0 critique/sérieux ; `mvn clean verify` + `npm test`.

---

### LOT 5 — BO-003 + effet de levier *(11 pts)*

**Objectif.** Le second gabarit le plus réutilisé, et **4 écrans P0 pour le prix d'un et demi**.

**Écrans.** **BO-003**, puis **BO-005**, **BO-006**, **BO-008** quasi gratuitement.

**Composition.** En-tête identité pleine largeur (actions + statut) ; informations générales ; **tabs persistantes** ; vue d'ensemble = KPI, timeline, paiements, documents, agent affecté ; panneau droit alertes/actions **≥ 1440 px**, sinon dans le flux.
**Règles.** **Chaque tab possède une URL** ; actions financières **renvoyant aux écrans spécialisés, sans édition directe de transaction** ; alertes expliquant **la règle et la prochaine action** ; historique **paginé et non modifiable** ; informations sensibles masquées selon rôle ; **donnée manquante ≠ valeur vide → « Donnée indisponible »** ; impression via vue dédiée.

**Composants (7 nouveaux).** `MemberIdentityHeader` DOM-001, `Timeline` DAT-006, `Metric` DAT-007 (**tendance jamais par la couleur seule**), `Progress` DAT-008, `DocumentCard` DOM-008, `Dialog` OVR-001 (**480–640 px, une colonne, focus piégé puis restitué au déclencheur**), `ActionList` *(hors catalogue)*. `Tabs`, `DefinitionList`, `DataTable`, `Drawer` existent déjà.

**Backend.** `getOrganizationHistory` sur `member.membership_status_history` (**append-only, déjà protégée par V4/V5**) ; écritures `createOrganization` / `updateOrganization` / `createMembership` (`MEMBER.WRITE` + `MEMBER.SENSITIVE.WRITE`, audit, idempotence) ; `createExport` / `getExportStatus` (**export borné, avec métadonnées de filtre et date, approuvé, chiffré, expirable, audité**).
**AsyncAPI** : premier lot publiant des événements métier → **typer les charges MEM**. Aujourd'hui les 10 messages partagent une seule `DomainEvent` à `payload: additionalProperties: true`. Outbox via `integration.outbox_event` (ADR-004, *Acceptée*).

**Sections NON rendues, avec test négatif**

| Section | Motif |
|---|---|
| **Score de risque** | La fiche exige « **facteurs et date, pas seulement un nombre** ». Ni fixture, ni règle métier. Rendre un nombre nu violerait la fiche ; inventer les facteurs violerait `CLAUDE.md` |
| **Paiements du membre** | `payments[]` **n'a aucune FK vers un membre** — jointure possible seulement par le texte `payer` |
| **Agent affecté** | `AgentAssignmentCard` est **P1**, aucune fixture |
| **Documents** | Dépend de la GED ; **DEC-006** (conservation) et produit antivirus non arbitré |

**Stories à NE PAS implémenter, et pourquoi.** **US-MEM-002** — « selon le **score de similarité** » : ni calcul, ni seuil de blocage, ni seuil d'arbitrage ; `business-rules.md` ne mentionne pas la similarité. **Règle métier manquante.** **US-MEM-001** — format de l'identifiant non défini (`ref.number_sequence` existe **sans masque**) ; **l'unicité et la non-réutilisation, seul AC, restent implémentables**. **US-GRP-001** — le mécanisme est implémentable, **le référentiel des groupements réels du CNPM est absent du dépôt**.

**Critère de sortie.** BO-003 + 3 écrans dérivés ; 4 sections non rendues, verrouillées.
**Preuve.** Capture VP-1672 vs `ref-bo-003-member-detail.png` ; **une route testée par tab** (deep-link + rechargement + retour navigateur) ; test d'immuabilité de l'historique via l'API ; test de masquage par rôle ; **test ABAC : un Gestionnaire du groupement A ne voit pas les membres de B** ; test d'idempotence (double POST, même clé → un seul effet) ; focus piégé + restitué ; axe.

---

### LOT 6 — BO-001 Tableau de bord *(7 pts)*

**Objectif.** L'écran de démonstration par excellence — **et c'est précisément pourquoi il arrive en sixième position, pas en premier malgré son numéro.**

**Pourquoi ce placement.** BO-001 consomme `DataTable` (LOT 4) et `AdminShell` ; ses **KPI cliquables pointent vers des pages cibles qui doivent exister** (« clic KPI = filtre + page cible »). Le construire d'abord produit un tableau de bord dont tous les liens sont morts.

**Composition.** **5 KPI max** en première ligne, **≤ 2 rangées** ; graphique principal **8 col.** + segmentation **4 col.** ; tableau paiements **8 col.** + activité/alertes **4 col.** ; **à 1280 px → 4 KPI, le 5ᵉ déplacé** ; tablette → sections empilées.
**Règles.** KPI et alertes filtrés par exercice, périmètre **et autorisation** (côté serveur) ; **table accessible** pour chaque graphique ; rafraîchissement **conservant la dernière donnée lisible** ; alertes critiques triées **gravité puis date** ; **valeur absente → « Donnée indisponible », jamais un zéro implicite** ; **aucune animation au test visuel** ; **dates fixes, jamais « il y a 5 minutes »**. `charts-visualization.md` : thème **`design-tokens/echarts-theme.json` obligatoire** ; **3D interdit** ; donut **2–5 catégories** ; FCFA sans décimales, taux à une décimale.

**Composants (5).** `KpiStrip` VIS-002 (4 fiches), `ChartContainer` VIS-001 (4 fiches, réutilisé par BO-011/BO-028), `Donut chart`, `ActivityFeed`, `DateRangeFilter` *(3 hors catalogue ; `DateRangeFilter` mutualisé avec BO-028)*.

**Backend.** `getDashboard` typé ; read-model si ADR-006 promue. **Si ADR-006 est promue ici, ajouter les 2 colonnes de montants différées du LOT 4 → BO-002 devient intégralement fidèle à sa fiche.**

**Données.** `kpis` ✅, `monthlyCollections` ✅, `payments` ✅, segmentation dérivable de `members[].segment` ✅. **Manquent** : flux d'activité, alertes, exercices sélectionnables → non rendus ou fixture fictive (0.5).
**La règle « Donnée indisponible » permet de livrer conforme malgré les KPI non alimentés.** C'est le seul écran du programme où l'absence de donnée est explicitement prévue par la fiche.

**Information manquante à réclamer.** Le **catalogue KPI** (« définitions KPI ») invoqué par `ref-bo-001-dashboard.md` et `ref-bo-028-reporting.md` est **introuvable dans `docs/ui-handoff/`**. Chaque KPI doit exposer définition, source, période et mise à jour : **impossible sans lui**. Ne pas inventer.

**Critère de sortie.** BO-001 aux paliers, KPI cliquables atteignant leur cible.
**Preuve.** Capture VP-1672 vs `ref-bo-001-dashboard.png` ; **capture VP-1280 prouvant le repli à 4 KPI** ; test « KPI non alimenté → *Donnée indisponible* » ; table alternative accessible testée par graphique ; test « aucune animation » ; axe.

---

### LOT 7 — Socle formulaire → BO-009 *(13 pts)*

**Objectif.** Le socle de formulaire, via **la seule fiche du pack dont les 11 composants requis figurent tous au catalogue**. Contrat net, zéro arbitrage de vocabulaire. Elle valide `AdminWizard` (→ BO-012) et alimente PUB-012, MP-010, BO-004, MOB-012.

**Écrans.** **BO-009 (5 étapes sur 6)**, puis **BO-004**, **BO-010**, **PUB-012**, **PUB-013**.

**Composition.** Stepper **6 étapes** — Identification, Contacts, Catégorie, **Cotisation**, Documents, Validation ; formulaire **8–9 col.** + aide **3–4 col.** ; barre d'actions **sticky** (Annuler / Enregistrer brouillon / primaire) ; mobile une colonne, aide repliable, barre basse **safe-area**.
**Règles.** Sections de **4–8 champs** ; autosauvegarde avec **statut annoncé et reprise** ; **validation progressive sans empêcher la sauvegarde du brouillon** ; résumé d'erreurs en haut **qui reçoit le focus** ; **ne jamais vider les champs valides** ; erreur serveur **distinguée** de la validation locale ; documents = upload → **analyse antivirus** → statut ; soumission produisant un récapitulatif et **verrouillant la version examinée** ; navigation arrière conservant les données ; confirmation à la fermeture ; reprise **à la première étape incomplète**.

> **La fiche contient une correction du PNG, à respecter :** *« le champ Groupement n'est obligatoire que selon règle métier — **l'exemple visuel du PNG est un accident** »*.

**Composants (9).** `Stepper` NAV-007, `FormSection` FRM-014, `StickyFormActions` FRM-015 (**n'obscurcit pas le focus**), `Select` FRM-004, `Autocomplete` FRM-005, `DatePicker` FRM-006 (**clavier ET calendrier ET repli texte**), `TextArea` FRM-003, `RadioGroup` FRM-008 (**dépend de 0.2**), `FileUploader` FRM-010 (**état `virus-scan` obligatoire**).

**Backend.** `POST /enrollments`, `POST /enrollments/{id}/submit` (typés, `Idempotency-Key` requis) ; brouillon serveur ; pipeline document upload → S3 (**ADR-005 promue en 3.b**) → antivirus.

**Blocages, traités explicitement**

| Blocage | Traitement |
|---|---|
| **DEC-008 (Critique)** — barèmes | **Étape 4 « Cotisation » neutralisée explicitement**, sur le modèle exact de la section Contact de PUB-006 : état déclaré + **test négatif verrouillant l'absence**. **5 étapes sur 6 livrées.** Interdiction absolue d'inventer un taux |
| **Formats RCCM/NIF** — 0 occurrence dans le dépôt | Champs livrés **sans contrôle de format**, validation serveur sur la longueur seule, commentaire de renvoi à la décision. Implémenter une regex = inventer une règle métier |
| **Produit antivirus non arbitré** | `FileUploader` expose l'état `virus-scan` ; le backend ne l'implémente pas. **US-GED-002 non couverte** |
| **US-ENR-002** (« reprise après OTP ») | **DEC-004** — passerelle non choisie |
| **US-ENR-006** (« version de la politique ») | **Aucune politique de confidentialité versionnée n'existe dans le dépôt**, alors que RG-020 l'exige |

**Critère de sortie.** BO-009 5/6 étapes + 4 écrans dérivés ; étape 4 neutralisée et testée.
**Preuve.** Capture VP-1672 vs `ref-bo-009-enrollment-form.png` ; test « brouillon sauvegardé malgré champ invalide » ; test « retour arrière conserve les données » ; test « résumé d'erreurs reçoit le focus » ; test « soumission verrouille la version » ; **test prouvant que l'étape Cotisation est neutralisée et non simulée** ; test négatif « soumission bloquée si pièce requise manque » ; axe.

---

### LOT 8 — `MemberPortalShell` + Requêtes *(14 pts)*

**Objectif.** Ouvrir l'espace membre, et livrer **le seul domaine métier non bloqué par les décisions financières**.

**L'insight du lot.** Les requêtes et réclamations (REQ) ne dépendent d'**aucune** de DEC-002/003/005/008. Seules les *notifications* dépendent de DEC-004. **8 écrans P0 débloqués** au moment où la finance est encore à l'arrêt.

**Écrans.** **MP-001 (dégradé assumé)**, **MP-009**, **MP-010**, **MP-011**, **BO-021**, **BO-022** — et la shell des 13 écrans MP P0.

**Composition.** Header membre à navigation **horizontale** (Accueil, Cotisations/Paiements, Reçus, Requêtes, Profil) ; hero compact (identité + **montant dû**) ; **4 raccourcis max** ; grille **4/4/4 ou 4/5/3** ; **mobile : montant dû et Payer en premier**, bottom navigation.
**Règles.** **Ne jamais afficher les KPI globaux CNPM dans l'espace membre** ; CTA accessible **sans scroll sur mobile si une dette est due** ; requête compacte **sauvegardant la saisie** en cas de navigation involontaire ; **une notification critique ne dépend jamais d'un seul toast**.

**Composants.** `MemberPortalShell` LAY-002, `RequestConversation` DOM-007 (chronologie, pièces jointes), `ContributionSummary` DOM-002, + 6 hors catalogue (`Metric links`, `ReceiptList`, `RequestFormCompact`, `ProfileCompletion`, `SupportPanel`, `Button public CTA`) — **6 des 9 composants de MP-001 sont hors catalogue**.

**Backend.** `/service-requests` (liste, création, conversation, pièces) ; schéma `service` ; transitions d'état ; audit corrélé ; **`DecisionInput` avec `reason` obligatoire** sur la clôture.

**Trois sections bloquées, non rendues**

| Section | Blocage |
|---|---|
| `SupportPanel` | **UX-DEC-011 (BLOCKED)** — la fiche exige « horaires et **canal réel** ». Donnée institutionnelle inexistante |
| `ContributionSummary` | **DEC-008** — montant dû non calculable sans barème. Le hero affiche l'identité ; le bloc montant est **non rendu, pas simulé** |
| `ReceiptList` | **DEC-005** — signature des reçus |

> **MP-001 n'est pas livrable complet avant UX-DEC-011, DEC-005 et DEC-008.** Le lot livre la shell (qui débloque 13 écrans P0) et le domaine Requêtes à 100 %. **C'est ce qui le justifie — pas MP-001 lui-même.**

**Critère de sortie.** Shell + 5 écrans Requêtes complets ; MP-001 avec 3 sections verrouillées absentes.
**Preuve.** Capture VP-1672 vs `ref-mp-001-member-home.png` ; **test « aucun KPI global CNPM dans l'espace membre »** ; **3 tests de non-rendu** ; test de chronologie et pièces jointes ; axe.

---

### LOT 9 — `MobileAppShell` + Mobile membre *(13 pts, Flutter)*

**Objectif.** Ouvrir la plateforme mobile. **`mobile/lib/src/` ne contient que `cnpm_app.dart` : aucun design system mobile.** Les 44 composants `Web/Mobile` + les 2 `Mobile`-only n'ont **aucune implémentation Dart**.

**Placement.** Après MP-001 : MOB-003 réplique sa logique (`ContributionSummary`, même règle « pas de KPI globaux »). Tokens **disponibles** : `design-tokens/cnpm_theme.dart`.

**Écrans.** **MOB-001, MOB-002, MOB-003, MOB-011, MOB-012, MOB-013.**

**Composition.** Largeurs **360, 390, 430 px** ; safe areas ; top app bar ; bottom navigation **5 destinations max** ; **une action primaire par écran** ; **pas de reproduction des KPI globaux administratifs**.
**Règles.** **Cibles tactiles ≥ 44 px**, primaire mobile 48 px ; texte à **facteur de taille élevé** ; biométrie **uniquement après session initiale sécurisée si autorisée** ; **données sensibles protégées dans le stockage local** ; file de synchronisation visible, **conflits explicités** ; **erreurs réseau proposant reprise sans double envoi**.

**Composants.** `MobileAppShell` LAY-004, `BottomNavigation` NAV-004, portage Dart de `OtpInput`/`Button`/`TextInput`/`Alert`, + 6 hors catalogue (`MobileAuth`, `QuickActionList`, `MobileList`, `MobileWizard`, `OfflineBanner`, `SyncStatus`).

**Bloqué.** MOB-006/007 → **DEC-002**. MOB-009/010 → **DEC-005**. MOB-004/005 → **DEC-008**. Distribution → **DEC-010** (n'empêche pas de construire). **Aucune user story mobile n'existe** (19 écrans, 0 story) — à créer en 0.7.

**Critère de sortie.** 6 écrans MOB aux 3 largeurs.
**Preuve.** `flutter pub get && flutter analyze && flutter test` ; captures 360/390/430 vs `ref-mob-001-mobile-board.png` ; test « cible tactile ≥ 44 px » ; test « reprise réseau sans double envoi » ; test « aucune donnée sensible en clair dans le stockage local ».

---

### LOT 10 — Finance *(28 pts — BLOQUÉ)*

**Écrans.** BO-011 → BO-013 → BO-012 → BO-014 → BO-015 → BO-016 → MP-002/003/004/005 → MOB-004/005/006/007 → PUB-015 → étape 4 de BO-009. **13 des 56 écrans P0.**

> **C'est le plus gros risque de rework du programme, et le seul dont l'erreur est irrécupérable.** `CLAUDE.md` : *« Ne jamais modifier ou supprimer une écriture financière validée ; utiliser une écriture compensatrice. »* Un barème inventé produit des appels de cotisation faux **qu'on ne peut pas effacer** — seulement compenser, avec trace permanente.

| Décision | Échéance déclarée | Ce qui manque |
|---|---|---|
| **DEC-002** Mobile Money | « Avant sprint paiement » | Aucun opérateur, sandbox, mécanisme de règlement. `PaymentChannelBadge` présuppose des canaux non arbitrés |
| **DEC-003** Banques / relevés | « Avant rapprochement » | Ni banque, ni format (ISO 20022 / CSV / MT940) |
| **DEC-005** Signature des reçus | « Avant reçu officiel » | **PUB-015 n'a aucun mécanisme de vérification défini.** La fiche BO-014 interdit « un faux cachet/QR en production » |
| **DEC-008** Barèmes | « Avant appels » | Grille, paliers, dérogations, exercice ; **+ règles d'arrondi (US-DB-005)** |

**Règles à câbler le jour venu, non négociables.** **Paiement reçu / rapproché / confirmé / reçu émis = 4 états distincts jamais confondus** ; **transaction sélectionnée immuable** ; **un paiement confirmé ne peut être confirmé deux fois — idempotence testée, double clic sans doublon** ; correction = **écriture compensatrice** ; **rapprocher puis confirmer selon séparation des tâches** ; reçu généré **seulement après confirmation et validation CNPM** ; **montant appelé = payé + reste**, sauf ajustement affiché ; statut « **Encaissé** » — *le PNG affiche « Encaisser », erreur de libellé* ; anomalie = **type + commentaire** ; audit = acteur, horodatage, résultat. Composition BO-014 : **3 zones ≥ 1440 px — liste 31 %, rapprochement 29 %, aperçu 40 %** ; minima liste 360 / formulaire 420 / preview 460 px ; **mobile non destiné aux opérations complexes**.

**Préalable technique.** `payments[]` n'a **aucune FK vers un membre** : le modèle de rapprochement est à construire, pas à câbler.
**28 pts est une estimation basse**, valable seulement si les 4 décisions arrivent complètes et cohérentes.

---

### LOT 11 — Vitrine R4 *(20 pts — INTERDIT en l'état)*

**Écrans.** PUB-004, PUB-006 complet, MP-015, MP-016, BO-037.

**L'interdiction est formelle.** `.claude/rules/member-showcase.md` : *« Do not implement the R4 API or migrations from the addendum until the promotion checklist and blocking decisions are closed. »* **`promotion-checklist.md` : 10 items, 0 coché.**

**Le module SHOWCASE n'existe nulle part.** **0 table** (les 9 tables proposées absentes de V1→V5 ; `grep "showcase"` sur `schema.sql` → 0) · **`member.organization` ne porte pas de `slug`** → **la route `/membres/:slug` n'est adressable par aucune donnée persistée** · **0 permission** (les 10 `SHOWCASE.*` absentes de `permissions.csv`) · **0 événement AsyncAPI** · contrat **hors canon** (`api-addendum.yaml` v`1.0.0-draft`) · **MP-015, MP-016 et BO-037 sont les 3 seules fiches sans section « Composants requis »** — précisément les 3 écrans soumis à la checklist.

**PUB-004** (annuaire, P0) : **aucune fiche, aucun PNG**, et cnpm.ml ne contient aucun annuaire. **Seul écran P0 dont la conception est entièrement à produire, sans source directrice.** **Aucune user story ne couvre le site public, l'annuaire, la vitrine, l'éditeur ou la modération** — trou de backlog, pas artefact de remappage.

**Séquence si/quand débloqué.** Fermer UX-DEC-003/004/005/006/013 + 0.6 + enum `SUSPENDED` → **écrire les stories R4 inexistantes** → promouvoir l'addendum dans `openapi.yaml` → permissions + SoD → Flyway `showcase` + `slug` + dictionnaire → événements → BPMN de modération → recette → matrice → **puis seulement** le code. `public-member-showcase.md` : SSR ou pré-rendu, **LCP < 2,5 s au p75**, lazy loading hors hero.

---

## 4. Chemin critique et dépendances

```
J0 ─ LOT 0 (arbitrages, 0 pt dev) ─────────────────────────────► permanent
     │                                    │
     ├─ PISTE FRONT ────────────────────► LOT 1 (10) ──► LOT 2 (7) ─┐
     │                                    │  socle+shell  PUB-001    │
     └─ PISTE BACK ─────────────────────► LOT 3 (12) ───────────────┤
                                          contrat+sécu+audit+ADM    │
                                                                    ▼
                                                          LOT 4 (12) BO-002
                                                                    │
                                                          LOT 5 (11) BO-003 ×4
                                                                    │
                                                          LOT 6 (7)  BO-001
                                                                    │
                                                          LOT 7 (13) BO-009
                                                                    │
                                                          LOT 8 (14) MP-001+REQ
                                                                    │
                                                          LOT 9 (13) MOBILE
```

**Chemin critique en une ligne**
> **LOT 0 (J0) ‖ [LOT 1 → LOT 2] (front, visible à J+17) ‖ [LOT 3] (back) → LOT 4 (BO-002) → LOT 5 → LOT 6 → LOT 7 → LOT 8 → LOT 9** — en escaladant **dès J0 et en parallèle** DEC-002/003/005/008 et UX-DEC-011/013.

**Dépendances dures**

| Lot | Bloqué par |
|---|---|
| LOT 1 | 0.1 (icônes → `IconButton`), 0.2 (a11y AUTH-001), 0.4 (`PublicFooter`) |
| LOT 2 | LOT 1 (`PublicShell`), 0.5 (fixtures + `dataAsOf`) |
| LOT 4 | LOT 1 (états) + LOT 3 (**filtres OpenAPI** + **3.b montants**) + 0.3 (baselines) |
| LOT 5 | LOT 4 (`AdminShell`, `DataTable`, `Drawer`) + LOT 3 (**AUD**) |
| LOT 6 | LOT 4 (`DataTable`) + LOT 5 (**pages cibles des KPI**) |
| LOT 7 | LOT 1 (`InlineErrorSummary`) + LOT 4 (`AdminShell`) + **0.2 avant `RadioGroup`** |
| LOT 8 | LOT 5 (`Timeline`) + LOT 7 (socle formulaire) |
| LOT 9 | LOT 8 (MOB-003 réplique MP-001) |

**Cumul non bloqué : 82 pts → 25 écrans P0 sur 56 (45 %), dont 4 des 14 maquettes intégralement fidèles.**

**Ce que le commanditaire voit, et quand**

| Jalon | Montrable |
|---|---|
| **Fin LOT 2** (~17 pts, ≈ 3,5 sem) | Accueil public sobre + connexion/2FA **conformes** + vitrine sur vraie shell. **3 des 4 pilotes touchés.** La plateforme a un visage. |
| **Fin LOT 4** (~29 pts, ≈ 6 sem) | **Le back-office ouvre. BO-002 fidèle à sa maquette. Les 4 pilotes sont adressés.** |
| **Fin LOT 6** (~47 pts) | **4 des 14 maquettes livrées** (BO-001, BO-002, BO-003, PUB-001 partiel) + 4 écrans dérivés. |
| **Fin LOT 9** (~82 pts) | **25 écrans P0**, web + mobile, 3 personas. Reste : finance (bloquée), R4 (interdite). |

---

## 5. Les décisions humaines qui bloquent réellement

### Bloquantes dures — l'équipe technique ne peut rien

| Décision | Écrans P0 bloqués | **Ce qui reste faisable sans elle** |
|---|---|---|
| **DEC-008** barèmes *(Critique)* | BO-011/012/013, MP-002/003, MOB-004/005, étape 4 de BO-009, `ContributionSummary` de MP-001 — **9** | **Tout sauf le calcul** : `BO-009` 5 étapes sur 6 ; `MP-001` shell + navigation ; `BO-002` sans les colonnes de montants ; `BO-003` sans les sections financières. `numeric(19,2)` et l'interdiction du flottant sont **déjà tenus** |
| **DEC-002** Mobile Money *(Critique)* | MP-004/005, MOB-006/007 — **4** | Rien de ces 4 écrans. Mais **le reste du portail et du mobile est constructible** (LOTS 8-9) |
| **DEC-003** banques / relevés *(Critique)* | BO-014, BO-015 — **2** | Rien. Le modèle de rapprochement lui-même dépend du format |
| **DEC-005** signature des reçus *(Critique)* | BO-016, MP-007/008, MOB-009/010, PUB-015 — **6** | Rien de ces écrans. **US-AUD-003** (« export **signé** ») est peut-être aussi bloqué — **portée de DEC-005 à clarifier (0.9)** |
| **UX-DEC-011** récupération / support / 2FA — **statut BLOCKED** | AUTH-003/004/005/006 ; affordances AUTH-001/002 ; `SupportPanel` de MP-001 ; step-up | **AUTH-001/002/008 sont livrables** — les liens restent absents, comme aujourd'hui. **Le reste de la sécurité (audience, Testcontainers, audit 401/403, ABAC) est faisable** |
| **UX-DEC-013** consentement contacts | Section Contact de PUB-006, MP-015, PUB-004 | **Tout PUB-006 sauf Contact.** Le précédent est déjà en place (`contactConsent: null` + test) |

**Ces 6 décisions conditionnent 20 des 56 écrans P0. Aucune n'est débloquable par l'équipe technique. Escalade à J0.**

### Bloquantes partielles — l'écran est constructible, un élément ne l'est pas

**UX-DEC-002** (logo) → placeholder versionné. **UX-DEC-003** (photothèque) → `image-placeholder.svg` ; *« pas d'image générée en production »*. **UX-DEC-004** (critères du badge) → `VerificationBadge` DOM-014 exige « never imply endorsement beyond status » : **impossible à respecter sans les critères** ; la fixture ne porte même pas `verifiedAt`. **UX-DEC-006** (URL) → **la route `/membres/:slug` de l'inventaire présuppose l'option 1 alors que la décision est ouverte**. **UX-DEC-007** (langues) → sélecteur exigé, langues non validées. **UX-DEC-008** (carte), **DEC-004** (SMS/e-mail : **l'alerte in-app et le journal restent livrables**), **DEC-006** (conservation), **DEC-010** (distribution : n'empêche pas de construire).

### Décisions à coût nul — fermables en une réunion

**UX-DEC-009**, **UX-DEC-012**, **UX-DEC-010**, vocabulaire des 52 composants, extension des fixtures, modèle vitrine. **Ce sont les seules dont le CNPM n'est dépendant d'aucun tiers. Les fermer coûte une réunion et débloque toutes les phases suivantes.**

### Trous de gouvernance sans décision ouverte — 10 à créer

Partenaires (vérification du claim) · témoignages (consentement) · newsletter (base légale) · textes institutionnels · formats RCCM/NIF · seuil de similarité MEM-002 · masque de l'identifiant CNPM · groupements réels · règles d'arrondi · produit antivirus.
**Plus, structurel : 87 écrans sur 101 n'ont pas de fiche.** `CLAUDE.md` impose la fiche pour toute interface → **toute story à surface UI hors des 14 écrans documentés est non implémentable, sans qu'aucune décision ne soit en cause.**

---

## 6. Le déficit de fixtures et la fidélité aux maquettes

### Le principe qui tranche : ce n'est pas un manque, c'est un garde-fou

La fiche PUB-006 contient sa propre résolution, explicitement :

> *« **Les sections vides ne laissent pas d'espaces morts.** »*
> *« **Le hero reste crédible sans photo : placeholder neutre, pas d'image générée en production.** »*
> `.claude/rules/member-showcase.md` : *« **Empty sections are not rendered.** »*

**La fiche n'exige pas que les sections soient remplies. Elle exige que le gabarit sache les rendre quand un membre fournit la donnée, et sache ne pas les rendre sinon.** Une vitrine sans galerie ni partenaires n'est pas une vitrine incomplète : c'est l'état par défaut légitime d'un membre qui n'a rien chargé. Traiter la fixture pauvre comme un bug à combler, c'est confondre « données de démonstration » et « exigence produit ».

**Doctrine : combler par la structure, pas par le contenu.** Généraliser le précédent `demo-showcase.gateway.ts:62` (`contactConsent: null` → section non rendue → **test qui verrouille l'absence**) à `gallery`, `documents`, `partners`, `testimonials`, `map`, `news`, `social`, `newsletter`. **Chaque section absente devient une assertion négative testée, pas un trou.**

### Ce que montre le PNG PUB-006 — et pourquoi on ne le reproduit pas

Le PNG affiche **cinq institutions réelles** : République du Mali (armoiries), **BAD**, **BOAD**, Direction Nationale des Routes, SOGEM. Plus un **témoignage attribué** à la Direction Nationale des Routes. Plus des contacts en **TLD réel `.ml`**, une carte de Bamako avec tuiles d'un fournisseur, une galerie de chantier, une brochure, des réseaux sociaux.

Les notes du dépôt le disent déjà : *« Les portraits, entreprises, projets, **partenaires**, signatures, cachets, **cartes** et QR codes des références sont **illustratifs** »* (`legal-and-asset-notes.md`) ; *« Pas de logos partenaires sans autorisation »* (`imagery.md`).

**SOMACOP SA est inventé ; la BOAD ne l'est pas.** Reproduire ces logos, ce serait fabriquer une caution institutionnelle.

**Et inventer des partenaires « fictifs » n'est pas une issue — c'est pire.** La tentation est : « inventons *Banque Régionale du Sahel* au lieu de la BOAD, c'est fictif donc permis ». Je le refuse, pour une raison de recette et non de droit : **un bandeau de logos fictifs fonctionne visuellement.** Il produit une page qui ressemble à la maquette, et il **éteint le signal** que le modèle de données partenaires — droits, consentement, ordre, alt, vérification du claim — n'existe nulle part : ni au schéma, ni aux fixtures, ni au catalogue (`PartnerLogoList` est absent). **La section vide est informative ; la section remplie de faux est anesthésiante.** `public-showcase-content.md` classe d'ailleurs « partenaire **non vérifié** » parmi les contenus interdits : c'est une **règle métier manquante**, pas une donnée manquante.

### La ligne de démarcation — applicable à tous les lots

> **Extension légitime** : toute donnée qui ne décrit **que** l'entité fictive elle-même et n'engage **aucun tiers** — raison sociale inventée, activité, projet, effectif, volumétrie, **structure vide typée**.
>
> **Décision humaine requise** : toute donnée qui **fait parler un tiers** (témoignage), **invoque une caution** (partenaire, certification, badge), **publie une personne** (contact, consentement), ou **mobilise un actif dont le CNPM ne détient pas les droits** (logo, photo, carte, police, icônes).

**Les six sections manquantes de PUB-006 tombent toutes du second côté. Ce n'est pas une coïncidence : ce sont exactement les sections qui transforment une page de présentation en preuve sociale. La preuve sociale ne s'invente pas — c'est précisément ce que `CLAUDE.md` interdit.**

### Extensions légitimes à réaliser (LOT 0.5, exécution LOTS 1 et 4)

| Ajout | Justification |
|---|---|
| `gallery: []`, `documents: []`, `partners: []`, `testimonials: []`, `news: []`, `products: []`, `social: []` — **tableaux vides typés** | Rend le **non-rendu implémentable et testable**. Cœur de la doctrine |
| `showcaseSample.organizationId = "MEM-0001"` | Le lien avec `members[]` n'est aujourd'hui possible **que par le nom**, et les contacts divergent (`adiarra@somacop.example` vs `contact@somacop.example`) |
| Second `showcaseSample` en `PUBLISHED` | Supprime le contournement documenté `demo-showcase.gateway.ts:66` (la fixture porte `DRAFT` sur une page **publique**) |
| Cohérence temporelle | `publication.lastSavedAt = 2026-07-16` contre `meta.period = "2024"` |
| `projects[].imageAssetId = null` explicite | Le champ **est déjà au schéma** (`member-showcase.schema.json:99`) ; présent-et-nul rend l'état `no-image` testable |
| `kpis.dataAsOf` | La fiche PUB-001 exige la date de mise à jour ; la fixture ne la porte pas |
| **`members[]` → ~25–30 lignes fictives** | **Sans quoi la pagination de BO-002 est inéprouvable** (6 lignes pour 4 968 annoncés) |
| Fixtures BO-030 (utilisateurs/rôles fictifs), BO-017 (campagnes), timeline BO-003 | Aucun tiers réel |
| Enum `publication.status` **+ `SUSPENDED`** | Alignement sur `requirements.md:48` — **défaut de contrat, pas décision** |
| Placeholders **déjà versionnés** | `image-placeholder.svg`, `company-logo-placeholder.svg`, `avatar-placeholder.svg`, `empty-state.svg` |

### Divergences PNG / fiche : à consigner, pas à résorber

Certifications : fixture `ISO 45001` vs PNG `OHSAS 18001` (**norme retirée**) + `Prix d'Excellence BTP Mali 2022`. Contacts : `.example` vs `.ml`. « Membre actif depuis Mai 2022 » : absent de tout contrat. `publication: DRAFT` sur une page publique. Statut « Encaisser » vs « **Encaissé** » (BO-014). Champ Groupement obligatoire (BO-009) : *« l'exemple visuel du PNG est un accident »*.

> `.claude/rules/ux-ui.md` : *« Ne pas recopier les incohérences de chiffres ou de libellés visibles dans les images générées. »*
> **La fixture gagne contre le PNG sur les certifications. Le PNG ne fait pas autorité sur les contacts. Les PNG sont directionnels ; les fiches et les tokens priment.**

### Ce que « fidèle aux maquettes » signifie concrètement, écran par écran

| Écran | Fidélité atteignable | Pourquoi |
|---|---|---|
| **BO-002** | **100 %** (98 % si 3.b non tranché : 2 colonnes en moins) | Maquette + fiche + fixtures + zéro blocage |
| **BO-003** | **~85 %** | Score de risque, agent, documents, paiements non rendus faute de règle et de FK |
| **BO-001** | **~90 %** | La règle « Donnée indisponible » couvre les KPI non alimentés |
| **BO-009** | **~85 %** | 5 étapes sur 6 (DEC-008) |
| **AUTH-001/002** | **~90 %** | Liens récupération/support absents (UX-DEC-011) |
| **PUB-001** | **~40 %** | Partenaires = tiers réels ; témoignages/newsletter sans données ni contrat ; API publique inexistante |
| **PUB-006** | **~45 %** | 6 sections du second côté de la ligne de démarcation |

**Dit sans détour : la fidélité à 100 % des maquettes PUB-001 et PUB-006 est irréaliste et le restera tant que les partenaires, les témoignages, la photothèque, la carte et le consentement des contacts ne seront pas arbitrés.** Ce n'est pas un problème d'exécution : ces éléments sont exactement ceux que `CLAUDE.md` interdit d'inventer. **La fidélité totale est atteignable sur BO-002, BO-001, BO-003 et BO-009 — les quatre écrans back-office qui portent 80 % de la valeur métier du programme.** C'est là qu'il faut mettre la démonstration.

---

## 7. Ce que je démarre immédiatement, dans l'ordre

### Jour 0 — aucune ligne de code

1. **Escalader DEC-002/003/005/008 à la Finance CNPM.** 13 écrans P0, aucune issue technique. Réunion sous 5 jours, avec les questions écrites.
2. **Escalader UX-DEC-011 (BLOCKED)** et **UX-DEC-013**. 7 écrans P0 + 3 sections.
3. **Convoquer la revue des 6 arbitrages à coût nul** (0.1 à 0.6). Une réunion de 2 h suffit ; la recommandation technique est déjà écrite pour 0.2.
4. **Réclamer** : le **logo vectoriel officiel** (UX-DEC-002), le **catalogue KPI** (invoqué par BO-001 et BO-028, **introuvable**), les **textes institutionnels** de PUB-001.
5. **Signaler** : gabarits `AdminMasterDetail` / `AdminReview` / `AdminMatrix` / `AdminCaseDetail` **jamais définis** dans `docs/03-patterns/` ; `CampaignBuilder` catalogue **5 états** vs fiche BO-017 **6 étapes** ; `InsightSummary` (BO-002) vs `InsightPanel` (VIS-004, P1) ; **101 écrans, pas 105**.

### Jours 1–3 — les deux pistes démarrent

6. **FRONT** : installer **Storybook** ; corriger `badge` `critical` → `error` avec test de non-régression ; `Checkbox.indeterminate`.
7. **BACK** : typer `CurrentUser` + `PageResource<T>` dans `openapi.yaml` ; `validate-openapi.sh` ; **aligner `CurrentUserController` sur son contrat** — c'est le plus petit changement qui prouve que le contrat contraint enfin quelque chose.
8. **BACK** : renseigner `cnpm.security.jwt.expected-audiences` — **l'audience n'est aujourd'hui pas vérifiée**. Une ligne de configuration, un trou de sécurité fermé.

### Jours 4–10

9. **FRONT** : les 5 composants d'état (`Skeleton`, `EmptyState`, `ErrorState`, `Toast`, `InlineErrorSummary`) + les 6 primitives. **C'est ce qui rend AUTH-001 et PUB-006 conformes.**
10. **BACK** : `Money` + `DecisionInput` câblés ; `security: []` + correction `verifyReceipt` ; **filtres sur `listOrganizations`**.
11. **BACK** : trancher **3.b** (ADR-006 ou exception) — c'est le seul arbitrage technique qui conditionne la fidélité complète de BO-002.
12. **BACK** : module **AUD** en écriture + événement sur 401/403 + test Testcontainers Keycloak.

### Jours 11–17

13. **FRONT** : `PublicShell` + `PublicHeader` + `PublicFooter` → **AUTH-008 livré**, AUTH-001/002 et PUB-006 repris. **Fin du LOT 1.**
14. **BACK** : module **ADM (`ref`)**, l'étalon — chaîne complète validée sur un domaine sans enjeu. **Fin du LOT 3.**
15. **FRONT** : **PUB-001 structurel** (5 sections + 6 assertions négatives). **Fin du LOT 2 — le commanditaire a quelque chose à voir.**
16. Étendre `members[]` à ~25–30 lignes fictives.

### Jour 18 → LOT 4 : `AdminShell` + `DataTable` → **BO-002**

**Le premier écran fidèle à sa maquette. À J+30 environ. C'est l'engagement que je prends devant le commanditaire — et le seul que je puisse tenir sans inventer une règle métier.**

---

## Ce que je ne sais pas, et n'ai pas comblé

- **L'origine du chiffre « 105 écrans »** : trois sources du dépôt disent **101**. Aucune trace des 4 supplémentaires.
- **Aucun mapping écran → opération OpenAPI n'existe** : `screen-inventory.csv` n'a pas de colonne API ; `traceability-matrix.csv` relie `Exigence → Story → Tag → Objets`, **jamais un écran**. Les opérations attribuées à BO-002 au LOT 4 sont une **inférence**.
- **Aucun lien écran ↔ story n'existe** : les 4 pilotes R0 de `PLANS.md` sont **introuvables dans `docs/01-product/`**. **Le périmètre R0 est défini par des identifiants qui n'appartiennent pas au backlog.**
- **La correspondance module ↔ schéma n'est écrite nulle part** : `governance` et `notification` sont des schémas **sans module** ; GRP, PRT, DB, TEC sont des modules **sans schéma**.
- **La délégation du login à Keycloak** est déduite d'ADR-003 + absence d'opération — **jamais énoncée dans `docs/04-api/`**.
- **`traceability-matrix.csv` ne discrimine pas au niveau de l'objet de données** : MEM-001..008 mappent tous vers le même triplet. Boilerplate généré.
- **Statut réel des 144 stories** : **`À affiner` pour les 144 — aucune ne satisfait la Definition of Ready** (un seul AC principal + une phrase générique répétée à l'identique ; ni scénario nominal, ni scénario d'erreur).
- **Si les institutions du PNG PUB-006 (BAD, BOAD, armoiries) ont été choisies délibérément ou produites par le générateur d'image** : rien dans le dépôt ne le documente. Le manifeste ne porte que dimensions, SHA256 et « référence directionnelle ».
