# BO-014 — Paiement, rapprochement et reçu

**Route :** `/admin/payments/reconciliation`  
**Référence :** `assets/reference-screens/full/ref-bo-014-payments-reconciliation.png`  
**Identifiant visuel :** `REF-BO-014`

## Objectif

Rapprocher de façon sûre les paiements entrants et préparer l émission contrôlée d un reçu officiel.

## Composition normative

- Trois zones sur ≥1440 px : liste 31 %, rapprochement 29 %, aperçu 40 %.
- Top actions contextuelles, tabs Paiements/Rapprochement/Reçus.
- Piste d audit sous le formulaire ; timeline sous l aperçu.
- À 1024–1439 px, l aperçu devient drawer ; mobile non destiné aux opérations complexes.

## Composants requis

- `AdminMasterDetail`
- `DataTable`
- `PaymentChannelBadge`
- `ReconciliationPanel`
- `ReceiptPreview`
- `Timeline`
- `AuditTrail`
- `Dialog`

## Interactions et règles

- Sélection transaction immuable.
- Recherche membre/cotisation avec contrôles de montant.
- Affectation complète/partielle et solde.
- Rapprocher puis confirmer selon séparation des tâches.
- Générer le reçu seulement après confirmation et validation CNPM.

## Critères d’acceptation spécifiques

- [ ] Idempotence testée ; double clic ne crée pas de doublon.
- [ ] Le montant affecté est validé côté serveur.
- [ ] Le preview fictif n utilise pas un faux cachet/QR en production.
- [ ] Toute anomalie exige un type et un commentaire.
- [ ] La piste d audit affiche acteur, horodatage et résultat.

## Règles communes

- Utiliser les tokens de `design-tokens/` ; aucune couleur ou dimension locale non justifiée.
- Les données visibles proviennent de `data/demo-fixtures.json` pour les tests.
- Couvrir chargement, vide, aucun résultat, erreur, accès interdit et session expirée.
- Toutes les actions respectent RBAC côté serveur et sont masquées/désactivées selon la politique approuvée.
- Fournir une story de page, des stories de composants critiques, un test axe et des captures Playwright.
- Le PNG est directionnel ; cette fiche et les patterns priment sur les détails incohérents de l’image.
