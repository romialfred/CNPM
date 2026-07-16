# Plan de recette

La recette s’appuie sur le classeur `CNPM_Backlog_Traceabilite_Recette.xlsx`. Chaque exigence possède au minimum un cas nominal et un cas de contrôle. Les cas financiers et sécurité ajoutent des tests de répétition, concurrence ou séparation des tâches.

## Critères de sortie PoC
- chaîne enrôlement-paiement-confirmation-reçu démontrée ;
- aucune double transaction lors des reprises ;
- rapprochement automatique mesuré ;
- reçus émis exclusivement après confirmation CNPM ;
- tableaux de bord réconciliés avec PostgreSQL ;
- export et restitution complets ;
- sauvegarde/restauration testée ;
- défaut critique de sécurité nul.
