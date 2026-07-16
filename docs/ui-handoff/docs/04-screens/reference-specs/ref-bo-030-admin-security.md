# BO-030 — Administration et sécurité

**Route :** `/admin/security/users`  
**Référence :** `assets/reference-screens/full/ref-bo-030-admin-security.png`  
**Identifiant visuel :** `REF-BO-030`

## Objectif

Administrer utilisateurs, rôles, 2FA, sessions et audit avec séparation des tâches.

## Composition normative

- Tabs Utilisateurs, Rôles, 2FA, Audit, Paramètres.
- Table utilisateurs 8–9 colonnes avec panneau sécurité 320–360 px.
- Matrice permissions sous la table ou route dédiée.
- Mobile : lecture limitée ; opérations sensibles sur desktop/tablette approuvée.

## Composants requis

- `Tabs`
- `DataTable`
- `StatusBadge`
- `RoleBadge`
- `PermissionMatrix`
- `SecuritySummary`
- `AuditAlertList`
- `Dialog`
- `Drawer`

## Interactions et règles

- Création/invitation, suspension, reset 2FA et révocation session sont des flux distincts.
- Les changements de rôle affichent permissions ajoutées/retirées.
- Les opérations sensibles demandent réauthentification si politique.
- Le journal d audit est immuable et filtrable.

## Critères d’acceptation spécifiques

- [ ] L administrateur technique n obtient pas automatiquement les droits financiers.
- [ ] Le reset 2FA nécessite motif et audit.
- [ ] Les statuts session/2FA sont explicites.
- [ ] Les permissions sont chargées depuis le backend.
- [ ] Aucun secret ou jeton n est affiché.

## Règles communes

- Utiliser les tokens de `design-tokens/` ; aucune couleur ou dimension locale non justifiée.
- Les données visibles proviennent de `data/demo-fixtures.json` pour les tests.
- Couvrir chargement, vide, aucun résultat, erreur, accès interdit et session expirée.
- Toutes les actions respectent RBAC côté serveur et sont masquées/désactivées selon la politique approuvée.
- Fournir une story de page, des stories de composants critiques, un test axe et des captures Playwright.
- Le PNG est directionnel ; cette fiche et les patterns priment sur les détails incohérents de l’image.
