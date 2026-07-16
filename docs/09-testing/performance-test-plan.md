# Plan de tests de performance

## Scénarios
- consultation simultanée du portail ;
- import de 1 200 prospects puis montée en charge progressive ;
- campagne de relance multicanale ;
- rafale de callbacks de paiement avec doublons ;
- import d’un relevé bancaire volumineux ;
- génération groupée de reçus et rapports ;
- exécution de tableaux de bord pendant l’activité transactionnelle.

## Mesures
Latence p50/p95/p99, débit, taux d’erreur, connexions PostgreSQL, verrous, requêtes lentes, backlog RabbitMQ, mémoire, CPU et temps de génération des exports.

Les volumes cibles définitifs sont arrêtés au cadrage et consignés dans les SLO.
