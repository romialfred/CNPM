# Scénarios end-to-end critiques

1. **Enrôlement complet** : prospect → dossier → complément → approbation CNPM → compte membre → notification.
2. **Paiement Mobile Money** : référence validée → paiement → callback signé → rapprochement → confirmation CNPM → reçu PDF/QR.
3. **Virement bancaire** : import relevé → dédoublonnage → score → rapprochement manuel → confirmation → reçu.
4. **Paiement partiel** : allocation sur échéance → recalcul solde → relance adaptée → situation de compte.
5. **Correction financière** : demande → double validation → écriture compensatrice → reçu remplacé → audit complet.
6. **Réactivation dormant** : segmentation → campagne → interaction → paiement → prime agent → tableau de bord.
7. **Requête membre** : soumission mobile → SLA → affectation → échanges → résolution → enquête satisfaction.
8. **Export sensible** : demande → step-up MFA → approbation → génération chiffrée → expiration → preuve d’audit.
9. **Panne partenaire** : timeout → circuit breaker → file d’erreur → reprise idempotente sans double effet.
10. **Restauration** : PITR PostgreSQL + documents + contrôles d’intégrité + validation métier.
