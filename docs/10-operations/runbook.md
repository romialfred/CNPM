# Runbook d’exploitation

## Incidents courants
- callback de paiement en échec : vérifier signature, idempotence, file d’erreur et rejouer via l’outil contrôlé ;
- rapprochement bloqué : analyser doublon, montant, référence et règle de score ;
- reçu non émis : vérifier confirmation, outbox, stockage objet et signature ;
- file RabbitMQ en croissance : mesurer consommateurs, poison messages et dépendance externe ;
- réplication PostgreSQL en retard : contrôler WAL, réseau, stockage et requêtes longues ;
- Keycloak indisponible : appliquer le runbook IAM et interdire tout contournement local.

Chaque action de production doit être nominative, datée, approuvée lorsque sensible et liée à un ticket.
