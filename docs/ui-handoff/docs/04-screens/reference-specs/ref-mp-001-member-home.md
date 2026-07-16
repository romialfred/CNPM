# MP-001 — Accueil portail membre

**Route :** `/member/home`  
**Référence :** `assets/reference-screens/full/ref-mp-001-member-home.png`  
**Identifiant visuel :** `REF-MP-001`

## Objectif

Donner au membre une vue immédiate de ses obligations, documents, requêtes et actions essentielles.

## Composition normative

- Header membre avec navigation horizontale ; hero compact avec identité et montant dû.
- Quatre raccourcis maximum.
- Reçus, nouvelle requête, activité et profil sur grille 4/4/4 ou 4/5/3.
- Mobile : montant dû et Payer en premier, sections empilées, bottom navigation.

## Composants requis

- `MemberPortalShell`
- `ContributionSummary`
- `Button public CTA`
- `Metric links`
- `ReceiptList`
- `RequestFormCompact`
- `Timeline`
- `ProfileCompletion`
- `SupportPanel`

## Interactions et règles

- Le CTA Payer ouvre le montant et la cotisation concernés.
- La requête compacte sauvegarde la saisie si navigation involontaire.
- Les reçus se téléchargent avec statut et taille.
- Le profil incomplet pointe vers les champs manquants.

## Critères d’acceptation spécifiques

- [ ] Ne pas afficher les KPI globaux CNPM dans l espace membre.
- [ ] Montant, échéance et statut sont cohérents.
- [ ] Le CTA reste accessible sans scroll sur mobile si une dette est due.
- [ ] Les documents sont nommés clairement.
- [ ] Le support affiche horaires et canal réel.

## Règles communes

- Utiliser les tokens de `design-tokens/` ; aucune couleur ou dimension locale non justifiée.
- Les données visibles proviennent de `data/demo-fixtures.json` pour les tests.
- Couvrir chargement, vide, aucun résultat, erreur, accès interdit et session expirée.
- Toutes les actions respectent RBAC côté serveur et sont masquées/désactivées selon la politique approuvée.
- Fournir une story de page, des stories de composants critiques, un test axe et des captures Playwright.
- Le PNG est directionnel ; cette fiche et les patterns priment sur les détails incohérents de l’image.
