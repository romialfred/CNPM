# Modules et frontières de domaine

| Code | Module | Responsabilités principales | Propriétaire logique |
|---|---|---|---|
| ADM | Administration et paramétrage | Référentiels, paramètres, calendriers, numérotation et configuration métier. | Administration |
| MEM | Membres et entreprises | Personnes, entreprises, adhésions, contacts et historique 360°. | Membres |
| ENR | Enrôlement et adhésion | Prospects, dossiers KYC, contrôles, compléments et décisions d’activation. | Enrôlement |
| COT | Cotisations et échéanciers | Exercices, barèmes, appels, échéanciers, soldes et ajustements. | Cotisations |
| PAY | Paiements et rapprochement | Références, transactions, allocations, relevés et rapprochements. | Paiements |
| REC | Reçus et attestations | Reçus officiels, attestations, vérification QR et corrections. | Reçus |
| REL | Recouvrement et relances | Segmentation, campagnes, actions, promesses et risque de recouvrement. | Recouvrement |
| PRT | Portail et application membre | Expérience membre Web/mobile, self-service, documents et notifications. | Portail membre |
| REQ | Requêtes et réclamations | Requêtes, réclamations, SLA, affectations, échanges et escalades. | Services membres |
| GRP | Groupements professionnels | Groupements, rattachements, référents et vues sectorielles. | Groupements |
| PRI | Primes et partage de revenus | Règles, calcul, validation des primes et partage de revenus. | Primes |
| GED | Gestion électronique des documents | Documents, versions, classification, conservation et antivirus. | GED |
| EVT | Événements et formations | Événements, formations, inscriptions, présence et certificats. | Événements |
| BI | Décisionnel et reporting | KPI, rapports, exports, prévisions et alertes décisionnelles. | Décisionnel |
| SEC | Sécurité et identité | Identités, rôles, permissions, 2FA, revues d’accès et incidents. | Sécurité |
| AUD | Audit et conformité | Journal immuable, preuves, exports et conformité. | Audit |
| INT | Intégrations et interopérabilité | Partenaires, adaptateurs, webhooks, outbox et reprise. | Intégrations |
| DB | PostgreSQL et données | Modèle PostgreSQL, migrations, intégrité, sauvegarde et performance. | Données |
| TEC | Architecture technique et exploitation | Configuration, déploiement, observabilité, disponibilité et support. | Technique |

## Règle de dépendance

Un module ne lit ni ne modifie directement les tables d’un autre module. Les vues de reporting dédiées, répliques ou événements publiés constituent les seuls mécanismes transverses autorisés, après décision d’architecture.
