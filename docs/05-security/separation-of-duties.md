# Séparation des tâches

| ID | Processus | Permission A | Permission B | Règle | Contrôle |
|---|---|---|---|---|---|
| SOD-001 | Barème financier | `CONTRIBUTION.RULE.WRITE` | `CONTRIBUTION.RULE.APPROVE` | Le créateur d’un barème ne peut pas le publier. | Bloquante |
| SOD-002 | Paramètre sensible | `ADMIN.PARAMETER.WRITE` | `ADMIN.REFERENTIAL.APPROVE` | Toute modification sensible exige un second valideur. | Bloquante |
| SOD-003 | Paiement | `PAYMENT.RECORD` | `PAYMENT.CONFIRM` | L’enregistreur d’un paiement ne doit pas être son confirmateur, sauf procédure d’urgence approuvée. | Bloquante |
| SOD-004 | Rapprochement exceptionnel | `RECONCILIATION.OVERRIDE` | `RECONCILIATION.APPROVE` | L’auteur d’une dérogation ne peut pas la valider. | Bloquante |
| SOD-005 | Reçu | `RECEIPT.ISSUE` | `RECEIPT.CANCEL` | L’annulation d’un reçu exige un acteur distinct ou une validation hiérarchique. | Alerte et validation |
| SOD-006 | Prime | `INCENTIVE.CALCULATE` | `INCENTIVE.APPROVE` | Le calculateur d’une prime ne peut pas approuver le même état. | Bloquante |
| SOD-007 | Rôle sensible | `IAM.ROLE.ASSIGN` | `IAM.ACCESS.REVIEW` | Une attribution de rôle privilégié doit être revue par un autre administrateur. | Bloquante |
| SOD-008 | Restauration | `OPS.DEPLOY` | `DATA.RESTORE` | Une restauration de production requiert approbation hors bande et double contrôle. | Procédure |
