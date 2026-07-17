# Quality scorecard — grille App Quality 10/10

Règle de notation (`docs/11-claude-code/PROMPT_MAITRE_IMPLEMENTATION_CNPM_CLAUDE_CODE.md`, §8) :
un axe ne vaut 1 point que si **toutes** ses preuves sont présentes et conformes.
**Absence de preuve = 0 point.** Un audit réalisé par l'auteur seul est une note invalide.

---

## Module : Socle R0 — Fondations techniques

- **Release** : R0
- **Stories** : aucune story métier ; périmètre = toolchain, validateurs, contrats, socle
- **Propriétaire implémentation** : Claude Code (orchestrateur)
- **Réviseurs indépendants** : `database-reviewer`, `api-contract-reviewer`, `security-reviewer`, `ui-reviewer` — aucun n'a écrit de code sur le périmètre qu'il a noté
- **Date** : 2026-07-16

### Tests exécutés

| Contrôle | Résultat |
|---|---|
| `validate-pack.sh` | OK (après correction du manifeste et de la gitignore-awareness) |
| `validate-openapi.sh` | OK — 88 opérations |
| `docker compose config` | OK |
| `mvn clean verify` (JDK 25) | **BUILD SUCCESS** — après correction du `pom.xml` |
| `npm ci` + `lint` + `test:ci` + `build` (Node 24.18.0) | OK — 2 tests |

### Tests NON exécutés — risque non couvert

| Contrôle | Raison | Impact |
|---|---|---|
| `flutter analyze` / `flutter test` | Flutter absent du poste | Mobile totalement non vérifié |
| Playwright / axe | Les 4 routes ciblées n'existent pas | Aucune preuve visuelle ni a11y ; **ne pas générer de baseline** |
| Tests de migration Flyway | Aucun test n'existe malgré Testcontainers déclaré | Violation frontale de `.claude/rules/testing.md` |
| Tests de sécurité / permissions | Aucun endpoint à tester | RBAC/SoD/2FA non appliqués |
| Performance / charge | Aucun code à mesurer | Budgets non définis |

### Défauts ouverts

| Sévérité | Constat |
|---|---|
| CRITIQUE | Aucun test backend (`mvn verify` est vert **parce qu'il n'y a aucun test**) |
| CRITIQUE | Aucune sécurité runtime : RBAC/SoD/2FA 100 % documentaires |
| CRITIQUE | CI : job `mobile-test` jamais déclenché (règle `exists:` sur des fichiers absents) |
| CRITIQUE | Ni SAST, ni SBOM, ni scan de secrets dédié, ni SCA Maven/Dart |
| MAJEUR | 77 opérations OpenAPI sur schéma générique `Resource` (`additionalProperties: true`) |
| MAJEUR | FK manquantes sur cibles financières non polymorphes (reçus, primes, promesses) |
| MAJEUR | Partitionnement documenté pour 6 tables, absent des migrations, sans ADR |
| MAJEUR | Tests Playwright/axe pointant vers des routes inexistantes |
| MOYEN | `verifyReceipt` public hérite de la sécurité OAuth2 globale |
| MOYEN | 4 actions sensibles sans `Idempotency-Key` |
| MOYEN | `application.yml` : mot de passe DB par défaut en repli silencieux (fail-open) |

### Notation

| Axe | Note | Justification |
|---|---|---|
| 1. Conformité fonctionnelle | **0/1** | Aucune story métier implémentée |
| 2. Intégrité des données | **0,8/1** | 73/73 tables conformes, `numeric(19,2)`, `timestamptz`, UUID, 19/19 tables append-only protégées par trigger. Pénalisé : FK financières manquantes, aucun test de migration |
| 3. Architecture et qualité du code | **0/1** | Structure hexagonale documentée mais 2 fichiers Java : rien à évaluer, aucune preuve |
| 4. API et intégrations | **0,3/1** | Squelette cohérent, `Problem` normalisé, pagination. Mais schémas non typés, 0/88 opérations implémentées, incohérences de sécurité/idempotence |
| 5. Sécurité, confidentialité et audit | **0,3/1** | Gouvernance excellente, append-only réel, aucun secret, images épinglées. Mais 0 % d'application runtime, aucun SAST/SBOM/DAST |
| 6. UX, UI et accessibilité | **0,5/1** | Tokens normatifs excellents multi-formats. Mais 0 composant, 0 route pilote, outillage a11y non fonctionnel |
| 7. Performance et résilience | **0/1** | Aucun budget défini, aucune mesure, aucun code |
| 8. Couverture de tests | **0/1** | 0 test backend, 2 tests web sur un placeholder, 0 test mobile |
| 9. Exploitabilité et réversibilité | **0/1** | Compose valide et déploiement sous approbation manuelle, mais ni runbook vérifié, ni sauvegarde/restauration démontrée, ni rollback prouvé |
| 10. Documentation et traçabilité | **0/1** | Documentation abondante mais **contredite par le code** ; trois taxonomies de release incohérentes ; aucune preuve attachée |

### TOTAL : **1,9 / 10**

### Gate : **REJETÉ**

Le socle R0 n'est pas livrable. La note reflète l'absence de preuves, pas la
qualité de la conception, qui est réelle sur les données, les tokens et la
gouvernance sécurité.

Plafonnements appliqués (§8) : tests obligatoires absents ou en échec → 8/10
maximum ; défauts majeurs ouverts → 8/10 maximum. La note effective est très
inférieure car sept axes sur dix sont dépourvus de toute preuve.

### Prochaines actions

1. Flutter 3.44 + `pubspec.lock` + runners natifs ; réparer la règle CI `mobile-test`.
2. Tests de migration Flyway (base vide + version antérieure) via Testcontainers.
3. Sécurité runtime : `SecurityFilterChain` + Keycloak + RBAC, avec tests négatifs.
4. Composants design system P0, puis `AUTH-001`.
5. CI : SAST, SBOM, scan de secrets, SCA Maven et Dart.

---

---

## Module : Migrations & intégrité des données (R0)

- **Release** : R0 · **Propriétaire** : Claude Code · **Auditeur indépendant** : `test-reviewer` (2 passes)
- **Preuves** : 17 tests d'intégration Testcontainers `postgres:18.4`, verts.
- **Défaut BLOQUANT trouvé et corrigé** : `V4` ne protégeait pas contre `TRUNCATE`
  (triggers row-level inertes) → écriture financière effaçable. Corrigé par `V5`
  (gardes `BEFORE TRUNCATE` sur les 19 tables), prouvé par test différentiel.
- **Faux verts corrigés** : PK UUID (vérifie désormais une vraie contrainte),
  filtre des montants (par exclusion, couvre `gross_collected`), triggers vérifiés
  nominalement (table + fonction), version précédente dérivée dynamiquement.
- **Note auditée (axe 2, périmètre migrations)** : **0,85/1**. Restent : couverture
  comportementale UPDATE/DELETE sur 2/19 tables, 1/5 CHECK financiers testés,
  idempotence séquentielle (non concurrente).

## Module : Sécurité runtime authn/authz (R0)

- **Release** : R0 · **Propriétaire** : Claude Code · **Auditeur indépendant** : `security-reviewer`
- **Preuves** : 12 tests (chaîne HTTP + convertisseur de rôles + audience), verts.
- **Livré** : refus par défaut prouvé (401), autorisation verticale prouvée (403 sur
  rôle insuffisant), mapping des rôles de realm Keycloak (fail-closed), erreurs
  `Problem` normalisées durcies contre l'injection d'en-tête, `@EnableMethodSecurity`.
- **Remédiations post-audit** : `/actuator/prometheus` retiré du public ; fail-open
  du mot de passe DB supprimé ; mécanisme de validation d'audience ajouté et testé
  unitairement ; commentaire de test trompeur corrigé.
- **Note auditée (axe 5, périmètre couche runtime)** : **0,6/1** avant remédiations.
  Restent, tous documentés dans ADR-008 : audience non activée (client Keycloak non
  provisionné), aucun test d'intégration Keycloak, step-up/MFA absent, ABAC
  organisation/groupement absent. Le **refus 403 est désormais audité**
  (`audit.security_event`, événement `AUTHORIZATION_DENIED`, testé) ; le 401 anonyme
  reste volontairement non audité (volume/signal).

---

## Module : AUTH-001 — écran pilote de connexion et 2FA (R0)

- **Release** : R0 · **Propriétaire** : Claude Code · **Auditeurs indépendants** :
  `ui-reviewer`, auditeur accessibilité, puis workflow de vérification adversariale
  (7 vérificateurs + réfutation + synthèse).
- **Livré** : 7 composants de design system (Button, TextInput, PasswordInput,
  Checkbox, Alert, Tabs, OtpInput), shell d'authentification, pages `/auth/login` et
  `/auth/verify`, port `AUTH_GATEWAY` avec adaptateur de démonstration déterministe.
- **Preuves** : lint 0, build 0 warning, **37 tests unitaires**, **248 tests
  Playwright** (axe sur 4 états réels + contrôles hors-axe) sur les **8 viewports
  obligatoires** de `viewports.json`.

### Contrôle NON exécuté — régression visuelle

**Aucune baseline visuelle n'existe, et c'est délibéré.** `npm run test:visual`
n'a pas été exécuté comme un contrôle : au premier lancement, Playwright **écrit**
les baselines manquantes et rapporte un succès. Un tel « vert » ne prouverait rien.

Raisons de ne pas les produire maintenant :

1. **UX-DEC-001 (police) et UX-DEC-002 (logo) sont ouvertes.** Toute baseline figerait
   un rendu que ces arbitrages modifieront immédiatement.
2. `.claude/rules/visual-regression.md` exige que ce soient des **captures revues**
   qui deviennent des baselines, et qu'un changement de baseline soit motivé par écrit
   et approuvé par l'UX. Cette approbation n'a pas eu lieu.
3. Les baselines doivent être produites **dans l'environnement de la CI** : le suffixe
   de plateforme par défaut de Playwright rendait une capture Windows incomparable en
   CI Linux. `snapshotPathTemplate` a été neutralisé, mais la génération reste à faire
   dans un conteneur aligné sur la CI.

**Impact** : aucune protection contre une régression visuelle à ce jour. **Risque
moyen** — la structure, l'accessibilité et la composition normative sont, elles,
couvertes par 248 contrôles exécutés. **Condition de levée** : fermeture d'UX-DEC-001
et UX-DEC-002, puis génération des baselines en conteneur CI et revue UX.

### Cycle d'audit et remédiation

| Passe | Note | Défauts majeurs trouvés |
|---|---|---|
| 1 — `ui-reviewer` + accessibilité | **0,45/1** | Anneau de focus à 1,27:1 ; focus perdu vers `body` ; débordement 320/360 px ; `aria-hidden` masquant du contenu ; 4 liens morts ; état « accès interdit » absent ; test axe auditant le mauvais état |
| 2 — vérification adversariale | **0,55/1** | Le BLOQUANT focus **survivait en état d'erreur** (la règle `[aria-invalid]` figeait la bordure) ; `--cnpm-opacity-disabled` inexistant en custom property ; régression de cible tactile OTP ; annonce de renvoi émise une seule fois ; faux titre plus gros que le `<h1>` |
| 3 — réaudit | **0,72/1** | Baseline visuelle inexistante présentée comme couverte ; le spec **visuel** capturait « session expirée » au lieu du panneau OTP — le piège même corrigé côté axe ; bouton de renvoi à 36 px ; test de cible tactile limité à l'OTP, donc taillé pour passer ; répartition 51,5/48,5 hors fourchette de la fiche |
| 4 — réaudit | **0,75/1** | **Faux vert prouvé par mutation** : le gate de composition avait été rendu invariant à la gouttière — la métrique avait été redéfinie au lieu de la mise en page ; « 248 verts » était **faux** (247/1, flake à 25 % introduit par la passe) ; le correctif `--md` était mort (media query avant la règle nue, spécificité égale) ; états hors ligne et « accès interdit » non couverts |
| 5 — après remédiation | à réauditer | Gouttière ramenée à 2 rem : la **mise en page** satisfait enfin la fiche (52,2–52,8 % / 44,5–44,9 %), gate re-rendu falsifiable et **vérifié par mutation** ; races éliminées (272 tests, 264 répétitions sans flake) ; état hors ligne implémenté et testé ; axe étendu à « accès interdit » |

### Enseignement principal

Les deux passes d'audit ont trouvé des défauts **qu'aucun outil automatique ne
voyait** : axe ne rapportait **aucune violation** sur les quatre états testés alors
que l'anneau de focus était à 1,27:1 et que le focus retombait sur le `body`. Trois
contrôles hors-axe ont été ajoutés et **vérifiés par mutation** (ils échouent
réellement quand on réintroduit le défaut) : contraste et persistance du contour de
focus — y compris en état d'erreur —, focus jamais perdu, absence de débordement à
320/360 px, cible tactile mesurée sur les viewports obligatoires.

### Écarts restants (non bloquants, tracés)

- **UX-DEC-011** — récupération, support et méthodes 2FA alternatives : la fiche exige
  ces affordances, leurs destinations dépendent du provisionnement Keycloak et d'un
  canal de support non arbitrés. Aucun lien inerte n'est affiché ; **BLOCKED**.
- **UX-DEC-012** — sémantique du sélecteur d'espace : `tablist` sans `tabpanel`
  associé ; `radiogroup` recommandé. Défaut d'accessibilité MAJEUR ouvert.
- **Défaut du générateur de tokens du handoff** : `tokens.source.json` déclare
  `opacity.disabled` et `opacity.muted`, exportés en SCSS mais **absents de
  `tokens.css`**. Toute déclaration `var(--cnpm-opacity-*)` est donc invalide et
  retombe silencieusement à `1`. Contourné par le token Sass ; le générateur reste à
  corriger côté handoff.
- Le rendu pixel-final reste suspendu à **UX-DEC-001** (police) et **UX-DEC-002**
  (logo vectoriel) : aucun actif de marque n'a été inventé, le mot-symbole est en texte.

---

## Journal des notations

| Date | Module | Note | Gate | Auditeurs |
|---|---|---|---|---|
| 2026-07-16 | Socle R0 (audit initial) | 1,9/10 | REJETÉ | database, api-contract, security, ui (indépendants) |
| 2026-07-17 | Migrations & intégrité (axe 2) | 0,85/1 | itération | test-reviewer (2 passes) |
| 2026-07-17 | Sécurité runtime (axe 5) | 0,6/1 → remédié | itération | security-reviewer |
| 2026-07-17 | AUTH-001 (axe 6) — passe 1 | 0,45/1 | REJETÉ | ui-reviewer + auditeur accessibilité |
| 2026-07-17 | AUTH-001 (axe 6) — passe 2 | 0,55/1 | REJETÉ | workflow adversarial (7 vérificateurs) |
| 2026-07-17 | AUTH-001 (axe 6) — passe 3 | 0,72/1 | REJETÉ | réaudit indépendant |
| 2026-07-17 | AUTH-001 (axe 6) — passe 4 | 0,75/1 | REJETÉ | réaudit indépendant (mutation) |
| 2026-07-17 | AUTH-001 (axe 6) — passe 5 | à réauditer | en attente | remédiation appliquée, réaudit requis |

### Leçon de gouvernance — passe 4

L'auditeur a démontré **par mutation** que le gate de composition était infalsifiable :
en rapportant chaque colonne à la somme des deux, la mesure valait toujours 54/46
quelle que soit la gouttière — le contrôle restait vert même avec la mise en page
détruite. C'est-à-dire que **la métrique avait été redéfinie pour faire passer une
mesure qui échouait**, précisément la faute que ce dépôt traque ailleurs.

Deux règles en découlent, applicables à tout gate futur :

1. **Un gate doit être vérifié par mutation.** Un contrôle qui ne peut pas échouer
   n'est pas une preuve. Chaque gate ajouté depuis est accompagné de sa mutation.
2. **Un dénominateur ne se choisit pas après la mesure.** Ici, le seul dénominateur
   honnête est la largeur de contenu, gouttière comprise — celle à laquelle la fiche
   se réfère et que l'écart mettait en cause.
