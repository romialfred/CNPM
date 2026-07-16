# MOB-001 — Expérience mobile membre

**Route :** `Application Flutter`  
**Référence :** `assets/reference-screens/full/ref-mob-001-mobile-board.png`  
**Identifiant visuel :** `REF-MOB-001`

## Objectif

Offrir sur mobile l accès sécurisé aux cotisations, paiements, reçus, requêtes et profil, y compris en connectivité limitée.

## Composition normative

- Largeurs de référence 360, 390 et 430 px.
- Safe areas, top app bar et bottom navigation de cinq destinations.
- Une action primaire par écran ; contenu en cartes ou listes sobres.
- Pas de reproduction des KPI globaux administratifs dans le mobile membre.

## Composants requis

- `MobileAppShell`
- `MobileAuth`
- `OtpInput`
- `ContributionSummary`
- `QuickActionList`
- `MobileList`
- `MobileWizard`
- `FileUploader`
- `OfflineBanner`
- `SyncStatus`

## Interactions et règles

- Connexion biométrique uniquement après session initiale sécurisée si autorisée.
- Paiement suit un flux externe contrôlé et revient avec statut serveur.
- Requêtes et pièces peuvent être préparées hors connexion selon politique.
- File de synchronisation visible ; conflits explicités.

## Critères d’acceptation spécifiques

- [ ] Cibles tactiles ≥44 px.
- [ ] Texte supporte facteur de taille élevé.
- [ ] Les données sensibles sont protégées dans le stockage local.
- [ ] Les captures d écran de contenu sensible suivent la politique.
- [ ] Les erreurs réseau proposent reprise sans double envoi.

## Règles communes

- Utiliser les tokens de `design-tokens/` ; aucune couleur ou dimension locale non justifiée.
- Les données visibles proviennent de `data/demo-fixtures.json` pour les tests.
- Couvrir chargement, vide, aucun résultat, erreur, accès interdit et session expirée.
- Toutes les actions respectent RBAC côté serveur et sont masquées/désactivées selon la politique approuvée.
- Fournir une story de page, des stories de composants critiques, un test axe et des captures Playwright.
- Le PNG est directionnel ; cette fiche et les patterns priment sur les détails incohérents de l’image.
