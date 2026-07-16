# Matrice RBAC

## Rôles

| Code | Rôle | 2FA | Risque | Description |
|---|---|---|---|---|
| `SUPER_ADMIN_TECH` | Superadministrateur technique | Obligatoire | Très élevé | Exploitation de la plateforme, sans droits métier implicites. |
| `ADMIN_FONCTIONNEL` | Administrateur fonctionnel CNPM | Obligatoire | Élevé | Paramétrage fonctionnel, référentiels et administration métier. |
| `SECRETAIRE_GENERAL` | Secrétaire général | Obligatoire | Élevé | Supervision institutionnelle et validations stratégiques. |
| `DIRECTION_GENERALE` | Direction générale | Obligatoire | Élevé | Pilotage global, décisions et consultation décisionnelle. |
| `DIRECTION_FINANCIERE` | Direction financière | Obligatoire | Élevé | Supervision des cotisations, paiements, rapprochements et primes. |
| `COMPTABLE` | Comptable | Obligatoire | Élevé | Traitements comptables, rapprochement et confirmation financière. |
| `CAISSIER` | Caissier | Obligatoire | Élevé | Enregistrement des encaissements et pièces de caisse. |
| `AGENT_RECOUVREMENT` | Agent de recouvrement | Obligatoire | Élevé | Campagnes, relances, promesses de paiement et suivi terrain. |
| `VALIDATEUR_ENROLEMENT` | Validateur des enrôlements | Obligatoire | Élevé | Contrôle KYC et décision d’activation des adhésions. |
| `RESPONSABLE_GROUPEMENT` | Responsable de groupement | Obligatoire | Moyen | Pilotage des membres et activités de son groupement. |
| `REFERENT_GROUPEMENT` | Référent de groupement | Obligatoire | Moyen | Enrôlement assisté et suivi opérationnel de son périmètre. |
| `AUDITEUR_INTERNE` | Auditeur interne | Obligatoire | Élevé | Consultation des journaux, états, preuves et contrôles. |
| `AUDITEUR_EXTERNE` | Auditeur externe | Obligatoire | Élevé | Accès temporaire, en lecture seule, aux périmètres mandatés. |
| `JURIDIQUE` | Service juridique | Obligatoire | Élevé | Réclamations, contentieux, contrats et conformité. |
| `COMMUNICATION` | Service communication | Obligatoire | Moyen | Campagnes institutionnelles et contenus non financiers. |
| `MEMBRE_ADMIN` | Administrateur de l’entreprise membre | Obligatoire | Élevé | Administration du compte entreprise et de ses utilisateurs. |
| `MEMBRE_UTILISATEUR` | Utilisateur de l’entreprise membre | Selon politique | Moyen | Consultation et opérations déléguées par son entreprise. |
| `SUPPORT` | Support fonctionnel | Obligatoire | Moyen | Assistance et consultation limitée, sans validation financière. |
| `PRESTATAIRE_TECH` | Prestataire technique | Obligatoire | Très élevé | Maintenance contrôlée et accès temporaire tracé. |
| `ADMIN_SECURITE` | Administrateur sécurité | Obligatoire | Très élevé | Politiques d’accès, 2FA, revues et incidents de sécurité. |

## Permissions par rôle

### Superadministrateur technique (`SUPER_ADMIN_TECH`)

`DATA.RESTORE`, `INTEGRATION.REPLAY`, `OPS.DEPLOY`, `OPS.MONITOR.READ`

### Administrateur fonctionnel CNPM (`ADMIN_FONCTIONNEL`)

`ADMIN.PARAMETER.READ`, `ADMIN.PARAMETER.WRITE`, `ADMIN.REFERENTIAL.APPROVE`, `ADMIN.REFERENTIAL.READ`, `ADMIN.REFERENTIAL.WRITE`, `DOCUMENT.READ`, `DOCUMENT.WRITE`, `ENROLLMENT.CREATE`, `GROUP.READ`, `GROUP.WRITE`, `MEMBER.READ`, `MEMBER.WRITE`, `NOTIFICATION.TEMPLATE.WRITE`, `REPORT.EXPORT`, `REPORT.OPERATIONAL.READ`

### Secrétaire général (`SECRETAIRE_GENERAL`)

`AUDIT.READ`, `CONTRIBUTION.READ`, `DOCUMENT.READ`, `DOCUMENT.SENSITIVE.READ`, `ENROLLMENT.APPROVE`, `GOVERNANCE.WRITE`, `GROUP.READ`, `INCENTIVE.READ`, `MEMBER.READ`, `PAYMENT.READ`, `RECEIPT.READ`, `RECOVERY.READ`, `REPORT.EXECUTIVE.READ`, `REPORT.EXPORT`, `REPORT.OPERATIONAL.READ`, `REQUEST.READ`

### Direction générale (`DIRECTION_GENERALE`)

`AUDIT.READ`, `CONTRIBUTION.READ`, `GROUP.READ`, `INCENTIVE.READ`, `MEMBER.READ`, `PAYMENT.READ`, `RECEIPT.READ`, `RECOVERY.READ`, `REPORT.EXECUTIVE.READ`, `REPORT.EXPORT`, `REPORT.OPERATIONAL.READ`

### Direction financière (`DIRECTION_FINANCIERE`)

`AUDIT.READ`, `CONTRIBUTION.ADJUST`, `CONTRIBUTION.GENERATE`, `CONTRIBUTION.READ`, `CONTRIBUTION.RULE.APPROVE`, `CONTRIBUTION.RULE.WRITE`, `DOCUMENT.READ`, `INCENTIVE.APPROVE`, `INCENTIVE.CALCULATE`, `INCENTIVE.READ`, `INCENTIVE.RULE.WRITE`, `MEMBER.READ`, `PAYMENT.CANCEL`, `PAYMENT.CONFIRM`, `PAYMENT.READ`, `RECEIPT.CANCEL`, `RECEIPT.ISSUE`, `RECEIPT.READ`, `RECONCILIATION.APPROVE`, `RECONCILIATION.RUN`, `RECOVERY.READ`, `REPORT.EXECUTIVE.READ`, `REPORT.EXPORT`, `REPORT.OPERATIONAL.READ`

### Comptable (`COMPTABLE`)

`CONTRIBUTION.ADJUST`, `CONTRIBUTION.GENERATE`, `CONTRIBUTION.READ`, `DOCUMENT.READ`, `DOCUMENT.WRITE`, `INCENTIVE.CALCULATE`, `INCENTIVE.READ`, `MEMBER.READ`, `PAYMENT.CONFIRM`, `PAYMENT.READ`, `PAYMENT.RECORD`, `RECEIPT.ISSUE`, `RECEIPT.READ`, `RECONCILIATION.APPROVE`, `RECONCILIATION.OVERRIDE`, `RECONCILIATION.RUN`, `RECOVERY.READ`, `REPORT.EXPORT`, `REPORT.OPERATIONAL.READ`

### Caissier (`CAISSIER`)

`CONTRIBUTION.READ`, `DOCUMENT.READ`, `DOCUMENT.WRITE`, `MEMBER.READ`, `PAYMENT.READ`, `PAYMENT.RECORD`, `RECEIPT.READ`, `REPORT.OPERATIONAL.READ`

### Agent de recouvrement (`AGENT_RECOUVREMENT`)

`CONTRIBUTION.READ`, `DOCUMENT.READ`, `DOCUMENT.WRITE`, `MEMBER.READ`, `NOTIFICATION.SEND`, `PAYMENT.READ`, `RECEIPT.READ`, `RECOVERY.ACTION.WRITE`, `RECOVERY.CAMPAIGN.WRITE`, `RECOVERY.EXPORT`, `RECOVERY.READ`, `REPORT.EXPORT`, `REPORT.OPERATIONAL.READ`, `REQUEST.READ`, `REQUEST.WRITE`

### Validateur des enrôlements (`VALIDATEUR_ENROLEMENT`)

`AUDIT.READ`, `DOCUMENT.READ`, `DOCUMENT.SENSITIVE.READ`, `ENROLLMENT.APPROVE`, `ENROLLMENT.CREATE`, `ENROLLMENT.REVIEW`, `MEMBER.READ`

### Responsable de groupement (`RESPONSABLE_GROUPEMENT`)

`CONTRIBUTION.READ`, `DOCUMENT.READ`, `ENROLLMENT.CREATE`, `EVENT.WRITE`, `GROUP.READ`, `MEMBER.READ`, `RECOVERY.ACTION.WRITE`, `RECOVERY.READ`, `REPORT.EXPORT`, `REPORT.OPERATIONAL.READ`, `REQUEST.READ`, `REQUEST.WRITE`

### Référent de groupement (`REFERENT_GROUPEMENT`)

`CONTRIBUTION.READ`, `DOCUMENT.READ`, `DOCUMENT.WRITE`, `ENROLLMENT.CREATE`, `GROUP.READ`, `MEMBER.READ`, `RECOVERY.ACTION.WRITE`, `RECOVERY.READ`, `REQUEST.READ`, `REQUEST.WRITE`

### Auditeur interne (`AUDITEUR_INTERNE`)

`AUDIT.EXPORT`, `AUDIT.READ`, `CONTRIBUTION.READ`, `DOCUMENT.READ`, `DOCUMENT.SENSITIVE.READ`, `INCENTIVE.READ`, `MEMBER.READ`, `PAYMENT.READ`, `RECEIPT.READ`, `RECOVERY.READ`, `REPORT.EXECUTIVE.READ`, `REPORT.EXPORT`, `REPORT.OPERATIONAL.READ`, `SECURITY.EVENT.READ`

### Auditeur externe (`AUDITEUR_EXTERNE`)

`AUDIT.EXPORT`, `AUDIT.READ`, `CONTRIBUTION.READ`, `DOCUMENT.READ`, `INCENTIVE.READ`, `PAYMENT.READ`, `RECEIPT.READ`, `REPORT.OPERATIONAL.READ`

### Service juridique (`JURIDIQUE`)

`AUDIT.READ`, `DOCUMENT.READ`, `DOCUMENT.SENSITIVE.READ`, `DOCUMENT.WRITE`, `GOVERNANCE.WRITE`, `MEMBER.READ`, `REPORT.OPERATIONAL.READ`, `REQUEST.CLOSE`, `REQUEST.READ`, `REQUEST.WRITE`

### Service communication (`COMMUNICATION`)

`DOCUMENT.READ`, `DOCUMENT.WRITE`, `EVENT.WRITE`, `GROUP.READ`, `MEMBER.READ`, `NOTIFICATION.SEND`, `NOTIFICATION.TEMPLATE.WRITE`, `REPORT.OPERATIONAL.READ`

### Administrateur de l’entreprise membre (`MEMBRE_ADMIN`)

`CONTRIBUTION.READ`, `DOCUMENT.READ`, `DOCUMENT.WRITE`, `EVENT.WRITE`, `PAYMENT.READ`, `RECEIPT.READ`, `REQUEST.READ`, `REQUEST.WRITE`

### Utilisateur de l’entreprise membre (`MEMBRE_UTILISATEUR`)

`CONTRIBUTION.READ`, `DOCUMENT.READ`, `PAYMENT.READ`, `RECEIPT.READ`, `REQUEST.READ`, `REQUEST.WRITE`

### Support fonctionnel (`SUPPORT`)

`CONTRIBUTION.READ`, `DOCUMENT.READ`, `ENROLLMENT.CREATE`, `GROUP.READ`, `IAM.USER.READ`, `MEMBER.READ`, `PAYMENT.READ`, `RECEIPT.READ`, `RECOVERY.READ`, `REPORT.OPERATIONAL.READ`, `REQUEST.READ`, `REQUEST.WRITE`

### Prestataire technique (`PRESTATAIRE_TECH`)

`INTEGRATION.REPLAY`, `OPS.MONITOR.READ`

### Administrateur sécurité (`ADMIN_SECURITE`)

`AUDIT.EXPORT`, `AUDIT.READ`, `IAM.ACCESS.REVIEW`, `IAM.MFA.RESET`, `IAM.ROLE.ASSIGN`, `IAM.USER.READ`, `IAM.USER.WRITE`, `OPS.MONITOR.READ`, `SECURITY.EVENT.READ`, `SECURITY.INCIDENT.WRITE`
