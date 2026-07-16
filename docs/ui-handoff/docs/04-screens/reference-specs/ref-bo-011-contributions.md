# BO-011 — Cotisations et échéanciers

**Route :** `/admin/contributions`  
**Référence :** `assets/reference-screens/full/ref-bo-011-contributions.png`  
**Identifiant visuel :** `REF-BO-011`

## Objectif

Suivre les appels, montants dus, paiements, soldes et échéanciers par membre et période.

## Composition normative

- Filtres de contexte en une ligne.
- Cinq KPI au maximum.
- Tableau de cotisations dominant.
- Détail de l échéancier et graphique sous le tableau en 6/6.
- Mobile : liste, détail page séparée, graphique secondaire.

## Composants requis

- `FilterBar`
- `KpiStrip`
- `DataTable`
- `StatusBadge`
- `ContributionSummary`
- `InstallmentTable`
- `ChartContainer`
- `Drawer`

## Interactions et règles

- Sélection d une ligne actualise le détail sans perdre les filtres.
- Les appels générés et cotisations par membre sont des tabs routées.
- Créer un échéancier ouvre un assistant avec validation de somme et dates.
- L export respecte filtres et habilitation.

## Critères d’acceptation spécifiques

- [ ] Montant appelé = payé + reste, sauf ajustement explicitement affiché.
- [ ] Le statut “Encaissé” remplace l erreur de libellé “Encaisser”.
- [ ] Les dates échues et à venir sont distinguées.
- [ ] Le graphique utilise la même période que le tableau.
- [ ] L export contient métadonnées de filtre et date.

## Règles communes

- Utiliser les tokens de `design-tokens/` ; aucune couleur ou dimension locale non justifiée.
- Les données visibles proviennent de `data/demo-fixtures.json` pour les tests.
- Couvrir chargement, vide, aucun résultat, erreur, accès interdit et session expirée.
- Toutes les actions respectent RBAC côté serveur et sont masquées/désactivées selon la politique approuvée.
- Fournir une story de page, des stories de composants critiques, un test axe et des captures Playwright.
- Le PNG est directionnel ; cette fiche et les patterns priment sur les détails incohérents de l’image.
