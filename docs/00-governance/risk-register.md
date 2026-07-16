# Registre initial des risques

| ID | Risque | Probabilité | Impact | Criticité | Mesure | Responsable |
|---|---|---|---|---|---|---|
| R-001 | Qualité insuffisante des données membres | Élevée | Élevé | Critique | Profilage, dédoublonnage, règles de rejet, reprise progressive. | Responsable données |
| R-002 | Intégrations de paiement non stabilisées | Moyenne | Très élevé | Critique | Contrats d’API précoces, simulateurs, idempotence et rapprochement de secours. | Architecte intégration |
| R-003 | Fraude ou erreur sur les confirmations | Moyenne | Très élevé | Critique | Séparation des tâches, 2FA, limites, audit immuable et alertes. | RSSI/Finance |
| R-004 | Faible connectivité terrain | Élevée | Moyen | Élevé | PWA/mobile offline-first, files locales, reprise et compression. | Lead mobile |
| R-005 | Résistance au changement | Moyenne | Élevé | Élevé | Formation, relais groupements, pilote et support de proximité. | Change manager |
| R-006 | Dépendance au prestataire | Moyenne | Élevé | Élevé | Standards ouverts, dépôt CNPM, documentation, export et réversibilité testée. | Comité de pilotage |
| R-007 | Sous-dimensionnement PostgreSQL | Faible | Élevé | Moyen | Tests de charge, supervision, PgBouncer, index et réplication. | DBA |
| R-008 | Fuite de données personnelles | Moyenne | Très élevé | Critique | Classification, chiffrement, moindre privilège, DLP et réponse incident. | RSSI/DPO |
| R-009 | Dérive fonctionnelle du backlog | Élevée | Moyen | Élevé | Traçabilité exigences-stories-tests et contrôle de changement. | Product Owner |
| R-010 | Rapports décisionnels non fiables | Moyenne | Élevé | Élevé | Définitions KPI, réconciliation, lineage et validation métier. | Responsable BI |
