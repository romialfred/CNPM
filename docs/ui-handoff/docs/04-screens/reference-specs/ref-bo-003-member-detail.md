# BO-003 — Fiche membre 360°

**Route :** `/admin/members/:id`  
**Référence :** `assets/reference-screens/full/ref-bo-003-member-detail.png`  
**Identifiant visuel :** `REF-BO-003`

## Objectif

Rassembler identité, cotisations, paiements, documents, interactions, risque et prochaines actions d un membre.

## Composition normative

- En-tête identité pleine largeur avec actions et statut.
- Bloc informations générales, puis tabs persistantes.
- Vue d ensemble : KPI, timeline, paiements, documents et agent affecté.
- Panneau droit d alertes/actions sur ≥1440 px ; sous ce seuil, sections dans le flux.

## Composants requis

- `MemberIdentityHeader`
- `DefinitionList`
- `Tabs`
- `Metric`
- `Progress`
- `Timeline`
- `DataTable`
- `DocumentCard`
- `AgentAssignmentCard`
- `Alert`
- `ActionList`

## Interactions et règles

- Chaque tab possède une URL.
- Actions financières renvoient vers les écrans spécialisés, sans édition directe de transaction.
- Les alertes expliquent la règle et la prochaine action.
- L historique est paginé et non modifiable.

## Critères d’acceptation spécifiques

- [ ] Les informations sensibles sont masquées selon rôle.
- [ ] Le score de risque affiche facteurs et date, pas seulement un nombre.
- [ ] Les contacts ont actions explicites et respectent la confidentialité.
- [ ] Une donnée manquante est clairement distinguée d une valeur vide.
- [ ] L impression utilise une vue dédiée, pas la capture du dashboard.

## Règles communes

- Utiliser les tokens de `design-tokens/` ; aucune couleur ou dimension locale non justifiée.
- Les données visibles proviennent de `data/demo-fixtures.json` pour les tests.
- Couvrir chargement, vide, aucun résultat, erreur, accès interdit et session expirée.
- Toutes les actions respectent RBAC côté serveur et sont masquées/désactivées selon la politique approuvée.
- Fournir une story de page, des stories de composants critiques, un test axe et des captures Playwright.
- Le PNG est directionnel ; cette fiche et les patterns priment sur les détails incohérents de l’image.
