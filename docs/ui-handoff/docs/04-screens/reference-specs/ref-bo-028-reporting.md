# BO-028 — Reporting décisionnel

**Route :** `/admin/reporting`  
**Référence :** `assets/reference-screens/full/ref-bo-028-reporting.png`  
**Identifiant visuel :** `REF-BO-028`

## Objectif

Permettre aux directions d analyser recouvrement, concentration, risque, région, groupement et évolution.

## Composition normative

- Filtres/date et exports dans l en-tête.
- Six KPI maximum.
- Grille de graphiques, tableau pivot en bas, insights à droite sur grand écran.
- À 1280 px, insights sous les graphiques ; mobile propose des rapports simplifiés.

## Composants requis

- `DateRangeFilter`
- `KpiStrip`
- `ChartContainer`
- `MapPanel`
- `DataTable`
- `InsightPanel`
- `ExportMenu`
- `MetricDefinitionTooltip`

## Interactions et règles

- Filtres globaux synchronisés entre visualisations.
- Cliquer une série filtre ou ouvre le détail.
- Exports asynchrones avec notification.
- Chaque KPI expose définition, source, période et mise à jour.

## Critères d’acceptation spécifiques

- [ ] Les données sont cohérentes avec le catalogue KPI.
- [ ] Graphiques sans 3D et palette limitée.
- [ ] Table alternative accessible.
- [ ] La carte du Mali est un actif officiel validé, pas une approximation générée.
- [ ] Les recommandations automatiques sont identifiées comme telles et explicables.

## Règles communes

- Utiliser les tokens de `design-tokens/` ; aucune couleur ou dimension locale non justifiée.
- Les données visibles proviennent de `data/demo-fixtures.json` pour les tests.
- Couvrir chargement, vide, aucun résultat, erreur, accès interdit et session expirée.
- Toutes les actions respectent RBAC côté serveur et sont masquées/désactivées selon la politique approuvée.
- Fournir une story de page, des stories de composants critiques, un test axe et des captures Playwright.
- Le PNG est directionnel ; cette fiche et les patterns priment sur les détails incohérents de l’image.
