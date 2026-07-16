# Modèle PostgreSQL proposé — vitrine membre

Le module sera isolé dans le schéma `showcase`. Les migrations exécutables seront créées au démarrage de R4 sous `backend/src/main/resources/db/migration/`.

## Tables

| Table | Finalité | Contraintes principales |
|---|---|---|
| `showcase.member_showcase` | Racine de la vitrine d’une organisation | `organization_id` unique, `slug` unique, statut courant |
| `showcase.showcase_revision` | Révision immuable du contenu | numéro de version unique par vitrine, contenu structuré validé |
| `showcase.showcase_section` | Section ordonnée d’une révision | type contrôlé, ordre unique, visibilité |
| `showcase.showcase_media` | Référence GED et droits d’usage | actif GED, type, texte alternatif, consentement, date d’expiration |
| `showcase.showcase_submission` | Soumission à modération | auteur, date, révision, état |
| `showcase.moderation_decision` | Décision append-only | décideur distinct du soumissionnaire, motif obligatoire au rejet |
| `showcase.publication` | Publication et planification | une seule publication active, dates et version publiée |
| `showcase.slug_redirect` | Historique des redirections | ancien slug unique, nouveau slug, statut HTTP 301 |
| `showcase.analytics_daily` | Agrégats journaliers | aucune donnée personnelle, unicité vitrine/date/type |

## Types

- identifiants : `uuid` ;
- montants éventuels : `numeric(19,2)` ;
- dates : `timestamptz` ;
- contenu de section : colonnes relationnelles pour les attributs critiques et `jsonb` uniquement pour le payload schématisé de présentation ;
- états : contrainte `check` ou référentiel contrôlé, jamais texte libre.

## Intégrité et audit

- clés étrangères vers l’organisation, la GED et les comptes ;
- révisions, décisions et publications en append-only ;
- verrouillage optimiste sur l’agrégat ;
- exclusion empêchant deux périodes de publication actives qui se chevauchent ;
- index sur `slug`, `organization_id`, statut, dates de publication et modération ;
- outbox pour publication, suspension, invalidation cache et notification.

## Données interdites

Aucun NIF, détail bancaire, pièce d’identité, document confidentiel, e-mail personnel non consenti ou information de paiement ne doit être copié dans le schéma `showcase`.
