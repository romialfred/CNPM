# PUB-006 — Vitrine publique membre

**Route :** `/membres/:slug`  
**Référence :** `assets/reference-screens/full/ref-pub-006-member-showcase.png`  
**Identifiant visuel :** `REF-PUB-006`

## Objectif

Donner à chaque membre une mini-présence Web crédible et administrable pour valoriser ses activités, réalisations et contacts.

## Composition normative

- Header CNPM avec badge membre et navigation locale.
- Hero 5/7 : identité et CTA à gauche, média principal à droite.
- Bande de faits clés, puis activités, réalisations, galerie, certifications, brochure, partenaires, témoignages et contact.
- Footer commun CNPM avec attribution claire de la responsabilité du contenu au membre.

## Composants requis

- `PublicHeader`
- `VerificationBadge`
- `MemberShowcaseHero`
- `DefinitionList`
- `ShowcaseActivityCard`
- `ShowcaseProjectCard`
- `ShowcaseGallery`
- `DocumentCard`
- `PartnerLogoList`
- `Testimonial`
- `MapPanel`
- `ContactPanel`
- `Newsletter`

## Interactions et règles

- Navigation locale ancrée avec URL stable.
- Le badge ouvre une explication du statut et de sa date.
- Le formulaire de contact transmet sans exposer l email si configuré.
- La galerie possède une lightbox clavier et des textes alternatifs.
- La page respecte le statut publication et l indexation SEO.

## Critères d’acceptation spécifiques

- [ ] Le slug est canonique et redirige après renommage.
- [ ] Les sections vides ne laissent pas d espaces morts.
- [ ] Le hero reste crédible sans photo : placeholder neutre, pas d image générée en production.
- [ ] Le statut suspendu ou expiré modifie le badge et peut désindexer selon règle.
- [ ] Les médias sont optimisés et leurs droits tracés.

## Règles communes

- Utiliser les tokens de `design-tokens/` ; aucune couleur ou dimension locale non justifiée.
- Les données visibles proviennent de `data/demo-fixtures.json` pour les tests.
- Couvrir chargement, vide, aucun résultat, erreur, accès interdit et session expirée.
- Toutes les actions respectent RBAC côté serveur et sont masquées/désactivées selon la politique approuvée.
- Fournir une story de page, des stories de composants critiques, un test axe et des captures Playwright.
- Le PNG est directionnel ; cette fiche et les patterns priment sur les détails incohérents de l’image.
