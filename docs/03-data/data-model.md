# Modèle de données PostgreSQL

## Principes

- PostgreSQL 18.x est l’unique source de vérité relationnelle.
- UUID pour les clés techniques; références métier séparées et uniques.
- `numeric(19,2)` pour les montants, `timestamptz` pour les horodatages.
- Contraintes et clés étrangères en base; aucune intégrité critique uniquement dans l’interface.
- Migrations Flyway immuables, testées depuis une base vide et depuis la version précédente.
- Écritures financières validées immuables; correction par transaction compensatrice.
- Outbox transactionnelle pour les événements : enveloppe append-only, métadonnées de livraison modifiables jusqu'à l'état terminal `PUBLISHED`; clés d’idempotence pour les flux financiers.

## Schémas

| Schéma | Finalité | Classification | Rétention |
|---|---|---|---|
| `ref` | Référentiels et séquences | Métier interne | Conservation active + historique |
| `iam` | Identités, habilitations et 2FA | Restreint | Selon politique RH et audit |
| `member` | Personnes, entreprises, adhésions et groupements | Confidentiel | Vie membre + durée légale |
| `enrollment` | Prospects et dossiers d’enrôlement | Confidentiel | Dossier + durée légale |
| `contribution` | Barèmes, appels et échéanciers | Financier | 10 ans minimum à confirmer |
| `payment` | Transactions, allocations et rapprochement | Financier critique | 10 ans minimum à confirmer |
| `receipt` | Reçus et attestations | Financier critique | 10 ans minimum à confirmer |
| `recovery` | Campagnes et actions de recouvrement | Confidentiel | Durée relation + durée légale |
| `incentive` | Primes et partage de revenus | Financier critique | 10 ans minimum à confirmer |
| `service` | Requêtes, réclamations et SLA | Confidentiel | Selon type de dossier |
| `document` | Métadonnées GED et versions | Confidentiel | Selon catégorie documentaire |
| `governance` | Commissions, réunions et décisions | Interne | Archives institutionnelles |
| `event` | Événements et inscriptions | Interne | 5 ans à confirmer |
| `notification` | Modèles et traces de livraison | Confidentiel | 24 mois à confirmer |
| `integration` | Partenaires, outbox et webhooks | Restreint | Selon audit et contrat |
| `audit` | Audit, sécurité et exports | Restreint critique | 10 ans minimum à confirmer |
| `reporting` | Définitions et exécutions de rapports | Interne | Selon rapport |

## Tables

| Table | Finalité | Colonnes | Conservation | Immuable | Partitionnement |
|---|---|---:|---|---|---|
| `ref.reference_value` | Valeurs de référentiels historisées. | 13 |  | Non |  |
| `ref.number_sequence` | Séquences de numérotation métier. | 10 |  | Non |  |
| `iam.user_account` | Compte utilisateur applicatif. | 11 |  | Non |  |
| `iam.role` | Rôles applicatifs. | 9 |  | Non |  |
| `iam.permission` | Permissions atomiques. | 9 |  | Non |  |
| `iam.role_permission` | Association rôle-permission. | 8 |  | Non |  |
| `iam.user_role` | Attribution de rôle contextualisée. | 13 |  | Non |  |
| `iam.mfa_registration` | Facteurs 2FA enregistrés. | 11 |  | Non |  |
| `iam.access_review` | Campagnes de revue d’accès. | 11 |  | Non |  |
| `member.person` | Personnes physiques liées aux membres. | 11 |  | Non |  |
| `member.organization` | Personnes morales membres ou prospects. | 12 |  | Non |  |
| `member.organization_identifier` | Identifiants légaux et fiscaux. | 11 |  | Non |  |
| `member.address` | Adresses normalisées. | 13 |  | Non |  |
| `member.organization_contact` | Contacts et représentants. | 12 |  | Non |  |
| `member.membership` | Adhésion d’une entreprise au CNPM. | 12 |  | Non |  |
| `member.membership_status_history` | Historique immuable des statuts d’adhésion. | 7 | Vie membre + 10 ans | Oui |  |
| `member.professional_group` | Groupements professionnels. | 10 |  | Non |  |
| `member.group_membership` | Rattachement entreprise-groupement. | 11 |  | Non |  |
| `member.communication_preference` | Consentements et préférences de communication. | 12 |  | Non |  |
| `enrollment.prospect` | Prospects à convertir. | 11 |  | Non |  |
| `enrollment.enrollment_case` | Dossier d’enrôlement. | 12 |  | Non |  |
| `enrollment.enrollment_review` | Contrôles et demandes de complément. | 7 | 10 ans à confirmer | Oui |  |
| `enrollment.enrollment_decision` | Décisions d’enrôlement. | 8 | 10 ans à confirmer | Oui |  |
| `contribution.fiscal_year` | Exercices de cotisation. | 10 |  | Non |  |
| `contribution.rate_rule` | Barèmes versionnés. | 14 |  | Non |  |
| `contribution.contribution_call` | Appels de cotisation. | 14 |  | Non |  |
| `contribution.installment` | Échéances d’un appel. | 12 |  | Non |  |
| `contribution.adjustment` | Ajustements financiers compensatoires. | 9 | 10 ans minimum | Oui |  |
| `payment.payment_reference` | Références uniques de paiement validées par le CNPM. | 12 |  | Non |  |
| `payment.payment_transaction` | Transactions financières append-only. | 13 | 10 ans minimum | Oui | RANGE(paid_at) mensuel à partir du seuil défini |
| `payment.payment_allocation` | Affectations paiement-échéance. | 7 | 10 ans minimum | Oui |  |
| `payment.provider_event` | Événements entrants des prestataires de paiement. | 10 | 10 ans minimum | Oui | RANGE(received_at) mensuel |
| `payment.bank_statement` | Relevés bancaires importés. | 12 |  | Non |  |
| `payment.bank_statement_line` | Lignes de relevé bancaire. | 10 | 10 ans minimum | Oui | RANGE(booking_date) annuel |
| `payment.reconciliation_case` | Cas de rapprochement automatique ou manuel. | 13 |  | Non |  |
| `receipt.receipt` | Reçus officiels et versions de correction. | 11 | 10 ans minimum | Oui |  |
| `recovery.campaign` | Campagnes de recouvrement. | 12 |  | Non |  |
| `recovery.sequence_template` | Scénarios de relance. | 10 |  | Non |  |
| `recovery.sequence_step` | Étapes d’un scénario. | 11 |  | Non |  |
| `recovery.recovery_case` | Dossier de recouvrement par adhésion/exercice. | 12 |  | Non |  |
| `recovery.recovery_action` | Journal des actions de recouvrement. | 9 | Vie dossier + durée légale | Oui |  |
| `recovery.promise_to_pay` | Promesses de paiement. | 11 |  | Non |  |
| `incentive.bonus_rule` | Règles de prime de mobilisation. | 14 |  | Non |  |
| `incentive.bonus_calculation` | État mensuel de primes. | 12 |  | Non |  |
| `incentive.bonus_line` | Détail de prime par encaissement. | 10 | 10 ans minimum | Oui |  |
| `incentive.revenue_share_statement` | État de rémunération du prestataire. | 13 |  | Non |  |
| `incentive.financial_dispute` | Litiges de calcul. | 11 |  | Non |  |
| `service.sla_policy` | Politiques de délai. | 10 |  | Non |  |
| `service.request` | Requêtes et réclamations des membres. | 16 |  | Non |  |
| `service.request_message` | Échanges liés à une requête. | 7 | Selon type de dossier | Oui |  |
| `document.document` | Métadonnées documentaires. | 13 |  | Non |  |
| `document.document_version` | Versions physiques stockées en objet S3. | 11 | Selon catégorie | Oui |  |
| `document.document_link` | Liens document-objet métier. | 10 |  | Non |  |
| `governance.commission` | Commissions et organes. | 9 |  | Non |  |
| `governance.meeting` | Réunions institutionnelles. | 12 |  | Non |  |
| `governance.meeting_attendance` | Présences et procurations. | 10 |  | Non |  |
| `governance.decision` | Décisions et résolutions. | 12 |  | Non |  |
| `governance.decision_action` | Actions de mise en œuvre. | 11 |  | Non |  |
| `event.event` | Événements et formations. | 13 |  | Non |  |
| `event.registration` | Inscriptions à un événement. | 11 |  | Non |  |
| `notification.template` | Modèles de notifications versionnés. | 13 |  | Non |  |
| `notification.notification` | Notification à envoyer. | 13 |  | Non |  |
| `notification.delivery_attempt` | Tentatives de livraison. | 10 | 24 mois à confirmer | Oui |  |
| `integration.partner` | Partenaires et systèmes externes. | 10 |  | Non |  |
| `integration.endpoint_configuration` | Configuration non secrète des endpoints. | 13 |  | Non |  |
| `integration.outbox_event` | Outbox transactionnelle; enveloppe immuable et métadonnées de livraison contrôlées. | 10 | 24 mois | Oui (enveloppe) | RANGE(created_at) mensuel |
| `integration.webhook_subscription` | Abonnements sortants. | 11 |  | Non |  |
| `integration.webhook_delivery` | Livraisons de webhooks. | 9 | 24 mois | Oui |  |
| `audit.audit_event` | Journal d’audit métier inviolable. | 13 | 10 ans minimum | Oui | RANGE(created_at) mensuel |
| `audit.security_event` | Événements de sécurité. | 9 | 10 ans minimum | Oui | RANGE(created_at) mensuel |
| `audit.data_export` | Registre des exports de données. | 10 | 10 ans minimum | Oui |  |
| `reporting.report_definition` | Catalogue des rapports. | 12 |  | Non |  |
| `reporting.report_execution` | Historique d’exécution. | 13 |  | Non |  |

Le dictionnaire complet est fourni dans `data-dictionary.csv`; le jeu Flyway exécutable de référence se trouve dans `backend/src/main/resources/db/migration/`, de `V1__create_schemas_and_tables.sql` à la dernière version livrée.

## Vues de lecture

Les vues de lecture servent des écrans qui aplatissent plusieurs tables d'un **même
module** ; elles ne franchissent aucune frontière de module et ne contiennent aucune
donnée financière (les montants restent dans `contribution`/`payment`, servis à terme
par le read-model d'ADR-006).

| Vue | Migration | Rôle | Colonnes dérivées |
|---|---|---|---|
| `member.membership_list` | V7, V8 | Liste des membres BO-002 : adhésion jointe à son entreprise, son **groupement principal** et son **contact principal** (représentant légal actif — DATA-DEC-007), tous résolus de façon déterministe (LATERAL, un seul chacun). | `organization_legal_name`, `primary_group_code`, `primary_group_name`, `primary_contact_name`, `primary_contact_email`, `primary_contact_phone` (nullables) |
| `member.organization_status_history` | V9 | Historique BO-002 : changements de statut des adhésions d'une entreprise (lecture de la table append-only `membership_status_history`, rattachée à l'entreprise via l'adhésion). | `organization_id`, `membership_number` |
