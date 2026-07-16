# Pattern — Vitrine publique de chaque membre

## Objectif

Offrir à chaque membre une présence Web publique crédible, indexable et administrable, permettant de présenter son entreprise, ses activités, projets, produits/services, certifications, actualités et coordonnées.

## Architecture de contenu

1. Identité : nom, logo, tagline, secteur, localisation.
2. Statut CNPM : badge et portée de vérification.
3. À propos : résumé et chiffres clés.
4. Activités / produits / services.
5. Réalisations ou références.
6. Galerie.
7. Certifications et distinctions.
8. Brochure et documents publics.
9. Actualités du membre.
10. Contacts, carte et liens sociaux.
11. CTA : contacter, demander un devis ou visiter le site externe.

## Éditeur membre

Route : `/member/showcase/edit`.

- Sections activables/désactivables.
- Ordre limité aux modèles approuvés ; pas de page builder libre.
- Autosauvegarde et historique des versions.
- Aperçu desktop/mobile.
- Contrôle des champs requis, médias et textes alternatifs.
- SEO : titre, description, slug, aperçu de partage.
- Soumission à modération.
- Publication immédiate ou planifiée après approbation.

## Modération CNPM

Route : `/admin/showcases/moderation`.

- Diff visuel et textuel par version.
- Motif de rejet structuré.
- Vérification des droits médias, contacts, promesses commerciales et badge.
- Suspension/dépublication urgente avec audit.
- SLA et notifications configurables.

## SEO et performance

- Rendu serveur ou pré-rendu.
- Métadonnées Open Graph.
- URL canonique.
- `Organization` en données structurées lorsque validé.
- Sitemap et contrôle d’indexation.
- Images responsives et lazy loading hors hero.
- Objectif LCP public < 2,5 s au 75e percentile sous conditions définies.

## Vie privée

- Adresse personnelle interdite sans justification.
- Formulaire de contact transmet au membre sans exposer nécessairement l’e-mail.
- Consentement explicite pour analytics non essentiels.
- Mécanisme de signalement public.
