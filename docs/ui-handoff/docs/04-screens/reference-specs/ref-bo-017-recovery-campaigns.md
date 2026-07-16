# BO-017 — Campagnes de recouvrement

**Route :** `/admin/recovery/campaigns`  
**Référence :** `assets/reference-screens/full/ref-bo-017-recovery-campaigns.png`  
**Identifiant visuel :** `REF-BO-017`

## Objectif

Concevoir, planifier, lancer et analyser des relances multicanales avec contrôle des audiences et exclusions.

## Composition normative

- KPI compact, liste des campagnes à gauche et builder à droite.
- Builder en six étapes ; calendrier et performance sous la configuration.
- Alertes et comptes en retard dans un panneau secondaire.
- Tablette : liste puis page de détail ; mobile limité à consultation.

## Composants requis

- `KpiStrip`
- `CampaignList`
- `CampaignBuilder`
- `AudienceSelector`
- `ChannelSelector`
- `CadenceEditor`
- `SchedulePicker`
- `Calendar`
- `ChartContainer`
- `Alert`

## Interactions et règles

- Le volume d audience se recalcule avec les filtres.
- Afficher exclusions, consentements, doublons et coûts estimés avant lancement.
- Le lancement exige confirmation et habilitation.
- Échecs de diffusion accessibles avec relance contrôlée.

## Critères d’acceptation spécifiques

- [ ] Aucun envoi réel en environnement de test.
- [ ] Le fuseau et la date sont explicites.
- [ ] Le nombre d audience est reproductible.
- [ ] Les métriques définissent délivré/ouvert/conversion.
- [ ] Les grands cotisants peuvent suivre un traitement dédié.

## Règles communes

- Utiliser les tokens de `design-tokens/` ; aucune couleur ou dimension locale non justifiée.
- Les données visibles proviennent de `data/demo-fixtures.json` pour les tests.
- Couvrir chargement, vide, aucun résultat, erreur, accès interdit et session expirée.
- Toutes les actions respectent RBAC côté serveur et sont masquées/désactivées selon la politique approuvée.
- Fournir une story de page, des stories de composants critiques, un test axe et des captures Playwright.
- Le PNG est directionnel ; cette fiche et les patterns priment sur les détails incohérents de l’image.
