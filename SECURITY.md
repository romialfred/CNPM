# Politique de sécurité du dépôt

## Signalement
Ne jamais créer une issue publique contenant une donnée membre, un secret, un jeton, une preuve bancaire ou un détail exploitable. Utiliser le canal sécurisé défini par le CNPM.

## Règles minimales
- Aucun secret dans Git ; utiliser un coffre-fort et des variables injectées.
- 2FA pour les rôles sensibles et les comptes de maintenance.
- Accès temporaires, nominatifs, à moindre privilège et audités.
- Données de production interdites dans les environnements de développement et de test.
- Vulnérabilités critiques ou hautes non acceptées sans dérogation formelle.
- Les fichiers importés sont typés, limités, analysés et stockés hors du système de fichiers applicatif.
- Toute modification de RBAC, IAM, chiffrement, audit ou paiement nécessite une revue sécurité.

## Références
Consulter `docs/05-security/` et les procédures d’incident sous `docs/10-operations/`.
