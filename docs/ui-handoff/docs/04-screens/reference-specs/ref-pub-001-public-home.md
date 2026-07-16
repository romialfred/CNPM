# PUB-001 — Accueil public CNPM

**Route :** `/`  
**Référence :** `assets/reference-screens/full/ref-pub-001-public-home.png`  
**Identifiant visuel :** `REF-PUB-001`

## Objectif

Présenter le CNPM, convertir les prospects vers l adhesion et donner accès au portail et à l annuaire.

## Composition normative

- Header public, hero en grille 6/6, bande de chiffres, bénéfices, modules, actualités, preuve sociale, CTA et footer.
- Conteneur 1440 px maximum ; sections 80–112 px verticalement sur grand desktop.
- Le hero place texte et CTA à gauche, aperçu produit ou média institutionnel à droite.
- Sur mobile, ordre : titre, proposition, CTA, preuve courte, image.

## Composants requis

- `PublicHeader`
- `Hero`
- `Button public CTA`
- `Metric strip`
- `Feature grid`
- `Module links`
- `News cards`
- `Testimonial`
- `Partner logos`
- `Newsletter form`
- `PublicFooter`

## Interactions et règles

- Navigation ancrée ou routée avec état actif.
- CTA adhesion vers PUB-012 ; portail vers AUTH-001 ; annuaire vers PUB-004.
- Les chiffres clés viennent d une API publique mise en cache et affichent leur date de mise à jour.
- Les partenaires et témoignages ne sont publiés qu après consentement.

## Critères d’acceptation spécifiques

- [ ] LCP du hero optimisé ; image principale responsive et prioritaire.
- [ ] Le titre et les CTA sont visibles sans scroll à 1440x900.
- [ ] Aucun carrousel automatique.
- [ ] Tous les liens du footer et du header sont accessibles au clavier.
- [ ] Le contenu reste lisible sans images.

## Règles communes

- Utiliser les tokens de `design-tokens/` ; aucune couleur ou dimension locale non justifiée.
- Les données visibles proviennent de `data/demo-fixtures.json` pour les tests.
- Couvrir chargement, vide, aucun résultat, erreur, accès interdit et session expirée.
- Toutes les actions respectent RBAC côté serveur et sont masquées/désactivées selon la politique approuvée.
- Fournir une story de page, des stories de composants critiques, un test axe et des captures Playwright.
- Le PNG est directionnel ; cette fiche et les patterns priment sur les détails incohérents de l’image.
