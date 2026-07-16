# BO-001 — Tableau de bord back-office

**Route :** `/admin/dashboard`  
**Référence :** `assets/reference-screens/full/ref-bo-001-dashboard.png`  
**Identifiant visuel :** `REF-BO-001`

## Objectif

Fournir une synthèse actionnable de la collecte, des membres et des alertes selon le rôle connecté.

## Composition normative

- AdminShell : sidebar 252 px, topbar 72 px, padding 28 px.
- Cinq KPI maximum en première ligne.
- Graphique principal 8 colonnes et segmentation 4 colonnes.
- Tableau des paiements 8 colonnes et activité/alertes 4 colonnes.
- À 1280 px, réduire à quatre KPI et déplacer le cinquième ; tablette : sections empilées.

## Composants requis

- `AdminShell`
- `PageHeader`
- `KpiStrip`
- `ChartContainer`
- `Donut chart`
- `DataTable`
- `ActivityFeed`
- `Alert`
- `DateRangeFilter`

## Interactions et règles

- KPI et alertes filtrés par exercice, périmètre et autorisation.
- Un clic sur KPI applique un filtre et ouvre la page cible.
- Les graphiques exposent une table accessible.
- Le rafraîchissement conserve la dernière donnée lisible.

## Critères d’acceptation spécifiques

- [ ] Les totaux correspondent aux fixtures et aux définitions KPI.
- [ ] Aucune animation au test visuel.
- [ ] Les alertes critiques sont triées par gravité puis date.
- [ ] Le dashboard ne contient pas plus de deux rangées de KPI.
- [ ] Les valeurs absentes affichent “Donnée indisponible”, pas zéro implicite.

## Règles communes

- Utiliser les tokens de `design-tokens/` ; aucune couleur ou dimension locale non justifiée.
- Les données visibles proviennent de `data/demo-fixtures.json` pour les tests.
- Couvrir chargement, vide, aucun résultat, erreur, accès interdit et session expirée.
- Toutes les actions respectent RBAC côté serveur et sont masquées/désactivées selon la politique approuvée.
- Fournir une story de page, des stories de composants critiques, un test axe et des captures Playwright.
- Le PNG est directionnel ; cette fiche et les patterns priment sur les détails incohérents de l’image.
