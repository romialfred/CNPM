# Composants métier CNPM

## `MemberIdentityHeader`

Affiche nom, code, catégorie, groupement, statut et actions autorisées. Le statut est lisible sans couleur. Les actions viennent du RBAC.

## `ContributionSummary`

Affiche montant appelé, payé, solde, échéance et état. Les montants utilisent XOF/FCFA de façon cohérente. Le solde ne peut être négatif dans la présentation sans explication.

## `ReconciliationPanel`

Permet d’affecter un paiement à un membre, une cotisation et une ou plusieurs échéances. Il expose : montant reçu, montant affecté, reste à affecter, idempotence, commentaire, piste d’audit et erreurs. La confirmation ne crée jamais deux reçus.

## `ReceiptPreview`

Aperçu d’un document officiel ; il ne remplace pas le PDF signé. Le QR code et le cachet ne sont affichés qu’après génération réelle. Les états brouillon, émis et annulé sont distincts.

## `CampaignBuilder`

Stepper : audience, message, cadence, planification, affectation, revue. Le récapitulatif final présente le volume, les canaux, coûts éventuels, exclusions et responsable.

## `ShowcaseEditor`

Éditeur de vitrine membre comprenant identité, hero, à-propos, activités, réalisations, galerie, certifications, contacts, SEO et publication. Il offre autosauvegarde, aperçu desktop/mobile, validation, soumission et historique de modération.

## `VerificationBadge`

Montre statut, date de mise à jour et portée de la vérification. Les états expiré/suspendu sont visibles et non confondus avec actif.
