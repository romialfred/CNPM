# BO-002 — Liste des membres

**Route :** `/admin/members`  
**Référence :** `assets/reference-screens/full/ref-bo-002-members-list.png`  
**Identifiant visuel :** `REF-BO-002`

## Objectif

Rechercher, filtrer, comparer et agir sur les membres sans perdre le contexte de navigation.

## Composition normative

- En-tête avec quatre actions maximum.
- Filtres avancés dans un panneau unique, chips actifs sous les contrôles.
- Tableau principal 9–10 colonnes ; panneau de synthèse facultatif 280–300 px sur grand desktop.
- Sous 1440 px, panneau de synthèse devient drawer ; sous 768 px, cartes de membre.

## Composants requis

- `PageHeader`
- `FilterBar`
- `SearchField`
- `DataTable`
- `BulkActionBar`
- `StatusBadge`
- `Pagination`
- `InsightSummary`

## Interactions et règles

- Filtres, tri et page synchronisés dans l URL.
- Sélection groupée avec portée explicite page/tous résultats.
- Les actions de ligne sont Voir, Modifier si autorisé, Historique ; pas trois icônes sans tooltip.
- Import/export ouvre un flux contrôlé avec rapport.

## Critères d’acceptation spécifiques

- [ ] La table possède caption, headers et tri accessible.
- [ ] Le statut utilise texte et indicateur.
- [ ] Montants alignés à droite et formatés FCFA.
- [ ] Retour depuis la fiche conserve page, filtres et scroll.
- [ ] Aucun total incohérent : actifs et dormants composent la base de membres, prospects séparés.

## Règles communes

- Utiliser les tokens de `design-tokens/` ; aucune couleur ou dimension locale non justifiée.
- Les données visibles proviennent de `data/demo-fixtures.json` pour les tests.
- Couvrir chargement, vide, aucun résultat, erreur, accès interdit et session expirée.
- Toutes les actions respectent RBAC côté serveur et sont masquées/désactivées selon la politique approuvée.
- Fournir une story de page, des stories de composants critiques, un test axe et des captures Playwright.
- Le PNG est directionnel ; cette fiche et les patterns priment sur les détails incohérents de l’image.
