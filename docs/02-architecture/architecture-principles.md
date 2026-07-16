# Principes d’architecture

1. **Souveraineté CNPM** : données, références de paiement, confirmations et reçus restent sous contrôle CNPM.
2. **PostgreSQL source de vérité** : aucune duplication non gouvernée des écritures métier.
3. **Monolithe modulaire d’abord** : simplicité opérationnelle et frontières strictes.
4. **API-first** : contrats versionnés avant implémentation.
5. **Sécurité par défaut** : refus par défaut, moindre privilège, 2FA et audit.
6. **Immutabilité financière** : correction par compensation, jamais par effacement.
7. **Idempotence** : tous les flux de paiement, webhook et reprise sont répétables sans double effet.
8. **Faible connectivité** : dégradation maîtrisée et reprise explicite.
9. **Standards ouverts** : OpenAPI, BPMN, SQL, formats d’export ouverts et conteneurs OCI.
10. **Observabilité intégrée** : métriques, traces, logs et indicateurs métier corrélés.
11. **Réversibilité testée** : export complet, documentation et restauration périodiquement vérifiés.
12. **Décision explicite** : toute exception structurante produit un ADR.
