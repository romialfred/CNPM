# AUTH-001 — Connexion et 2FA

**Route :** `/auth/login, /auth/verify`  
**Référence :** `assets/reference-screens/full/ref-auth-001-login.png`  
**Identifiant visuel :** `REF-AUTH-001`

## Objectif

Authentifier les utilisateurs administration et membres, puis appliquer la vérification renforcée sans divulguer d information de compte.

## Composition normative

- Page pleine hauteur, deux zones sur desktop : message de confiance 52–56 %, formulaire 44–48 %.
- Logo en haut à gauche, sélecteur de langue en haut à droite.
- Carte de connexion 600–640 px maximum ; panneau 2FA distinct mais aligné.
- Sous 1024 px, supprimer l illustration secondaire ; sous 768 px, formulaire seul avec bénéfices condensés.

## Composants requis

- `PublicShell minimal`
- `Tabs espace administration / membre`
- `TextInput email`
- `PasswordInput`
- `Checkbox`
- `Button public CTA`
- `OtpInput`
- `Alert`
- `Link`
- `Footer légal`

## Interactions et règles

- Le choix d espace modifie le realm/tenant ou la destination, pas les libellés de sécurité.
- Après identifiants valides, afficher la route 2FA ; ne pas afficher simultanément mot de passe et OTP en production sauf mode prototype.
- Autoriser collage du code, renvoi avec délai, autre méthode et récupération.
- Après succès, rediriger vers la destination demandée et annoncer la connexion.

## Critères d’acceptation spécifiques

- [ ] Le focus initial est sur l email ou le premier champ pertinent.
- [ ] Le message d erreur est neutre et relié au formulaire.
- [ ] Le code OTP peut être saisi au clavier, collé et lu correctement.
- [ ] La page reste utilisable à 200 % de zoom et 360 px de large.
- [ ] Aucun secret n est loggé ou envoyé à analytics.

## Règles communes

- Utiliser les tokens de `design-tokens/` ; aucune couleur ou dimension locale non justifiée.
- Les données visibles proviennent de `data/demo-fixtures.json` pour les tests.
- Couvrir chargement, vide, aucun résultat, erreur, accès interdit et session expirée.
- Toutes les actions respectent RBAC côté serveur et sont masquées/désactivées selon la politique approuvée.
- Fournir une story de page, des stories de composants critiques, un test axe et des captures Playwright.
- Le PNG est directionnel ; cette fiche et les patterns priment sur les détails incohérents de l’image.
