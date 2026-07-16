# BO-009 — Enrôlement / adhésion

**Route :** `/admin/enrollments/new`  
**Référence :** `assets/reference-screens/full/ref-bo-009-enrollment-form.png`  
**Identifiant visuel :** `REF-BO-009`

## Objectif

Créer un dossier complet, vérifiable et reprenable d entreprise/membre.

## Composition normative

- Stepper de six étapes : Identification, Contacts, Catégorie, Cotisation, Documents, Validation.
- Formulaire 8–9 colonnes et aide 3–4 colonnes.
- Barre d actions sticky, avec Annuler, Enregistrer brouillon et action primaire.
- Mobile : une colonne, panneau d aide repliable, barre basse safe-area.

## Composants requis

- `Stepper`
- `FormSection`
- `TextInput`
- `Autocomplete`
- `Select`
- `DatePicker`
- `Checkbox`
- `FileUploader`
- `InlineErrorSummary`
- `Progress`
- `StickyFormActions`

## Interactions et règles

- Autosauvegarde avec statut et reprise.
- Validation progressive sans empêcher la sauvegarde du brouillon.
- RCCM/NIF vérifiés via service si disponible ; résultat daté.
- Les documents passent par upload, analyse et statut.
- La soumission produit un récapitulatif et verrouille la version examinée.

## Critères d’acceptation spécifiques

- [ ] Tous les labels persistent.
- [ ] Les erreurs sont liées et listées.
- [ ] Le champ Groupement n est obligatoire que selon règle métier, contrairement à l exemple visuel accidentel.
- [ ] La navigation arrière conserve les données.
- [ ] La fermeture avec modifications non enregistrées demande confirmation.

## Règles communes

- Utiliser les tokens de `design-tokens/` ; aucune couleur ou dimension locale non justifiée.
- Les données visibles proviennent de `data/demo-fixtures.json` pour les tests.
- Couvrir chargement, vide, aucun résultat, erreur, accès interdit et session expirée.
- Toutes les actions respectent RBAC côté serveur et sont masquées/désactivées selon la politique approuvée.
- Fournir une story de page, des stories de composants critiques, un test axe et des captures Playwright.
- Le PNG est directionnel ; cette fiche et les patterns priment sur les détails incohérents de l’image.
