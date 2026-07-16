# Exigences fonctionnelles — vitrine membre

## Finalité

Chaque entreprise membre dispose d’un mini-site public, hébergé par la plateforme CNPM, pour présenter son identité, ses activités, produits ou services, réalisations, actualités et coordonnées. Le CNPM conserve la maîtrise de la publication et peut suspendre un contenu non conforme.

## Parcours

1. Le membre ouvre l’éditeur depuis son portail.
2. Il complète les sections autorisées et enregistre un brouillon.
3. Il prévisualise le rendu desktop, tablette et mobile.
4. Il soumet la version à validation.
5. Un modérateur CNPM approuve, rejette avec motif ou demande une correction.
6. Une version approuvée est publiée immédiatement ou planifiée.
7. Toute modification d’un contenu publié crée une nouvelle révision sans altérer la version publique actuelle.
8. Le membre consulte les statistiques agrégées autorisées.

## Sections configurables

- identité, slogan, résumé et secteur ;
- localisation, effectif, année de création et forme juridique ;
- activités, produits et services ;
- réalisations et références ;
- galerie et brochure ;
- certifications, distinctions, partenaires et témoignages ;
- actualités ;
- contacts, horaires, réseaux sociaux et carte ;
- métadonnées SEO et consentement à l’indexation.

## Règles de gestion

- Une organisation ne possède qu’une vitrine active, mais plusieurs révisions.
- Le `slug` est unique, stable, en minuscules et ne peut être changé sans redirection permanente validée.
- Seuls les membres autorisés de l’organisation peuvent éditer ou soumettre.
- Un contributeur ne peut pas approuver sa propre soumission.
- Les médias doivent provenir de la GED, avoir un droit d’usage déclaré, être analysés et respecter taille, type et dimensions.
- Le badge « membre vérifié » est calculé par le CNPM ; le membre ne peut pas l’activer.
- Une suspension retire la vitrine du public sans supprimer les révisions ni l’audit.
- Une version publique ne peut exposer RCCM, NIF, données personnelles ou documents internes non explicitement classés publics.
- Les contacts publics nécessitent un consentement et une date de vérification.
- Les statistiques ne doivent pas permettre l’identification individuelle des visiteurs.
- Toutes les transitions, décisions et publications sont auditées.

## États

`DRAFT → IN_REVIEW → APPROVED → SCHEDULED/PUBLISHED → UNPUBLISHED`

Transitions secondaires : `IN_REVIEW → REJECTED`, `PUBLISHED → SUSPENDED`, `REJECTED → DRAFT`.

## Exigences non fonctionnelles

- WCAG 2.2 AA ;
- rendu responsive de 320 px à 1 672 px ;
- pages publiques optimisées pour le référencement et le partage social ;
- cache public invalidé lors d’une publication ou suspension ;
- images responsives, formats modernes et chargement différé ;
- protection anti-abus des formulaires publics ;
- disponibilité et performance conformes au SLA validé.
