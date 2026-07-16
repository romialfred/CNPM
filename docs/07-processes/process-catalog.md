# Catalogue des processus

| Processus | Finalité | Fichier BPMN |
|---|---|---|
| enrollment | Create application → Validate documents → Request complement? → CNPM approval → Activate member | `enrollment.bpmn` |
| contribution-campaign | Select fiscal year and rule → Simulate calls → Four-eyes approval → Issue calls → Notify members | `contribution-campaign.bpmn` |
| mobile-money-payment | Create CNPM-approved reference → Initiate payment → Receive signed callback → Reconcile → CNPM confirmation → Issue receipt | `mobile-money-payment.bpmn` |
| bank-transfer-reconciliation | Import bank statement → Deduplicate lines → Score matches → Manual review if needed → Confirm payment → Issue receipt | `bank-transfer-reconciliation.bpmn` |
| receipt-correction | Open correction request → Validate reason and evidence → Four-eyes approval → Cancel original → Issue replacement → Notify member | `receipt-correction.bpmn` |
| recovery-campaign | Build segment → Approve scenario → Send reminders → Record interactions → Track promise → Escalate or close | `recovery-campaign.bpmn` |
| service-request | Submit request → Triage → Assign → Process → Member validation → Close | `service-request.bpmn` |
| bonus-calculation | Select period → Compute eligible collections → Apply versioned rules → Commission review → Approve → Publish statement | `bonus-calculation.bpmn` |
| data-export | Request export → Check purpose and scope → Step-up MFA → Approve if sensitive → Generate encrypted export → Expire and audit | `data-export.bpmn` |
| incident-response | Qualify → Contain → Eradicate → Recover → Notify stakeholders → Post-incident review | `incident-response.bpmn` |
