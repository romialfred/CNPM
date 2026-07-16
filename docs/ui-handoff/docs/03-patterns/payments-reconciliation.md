# Pattern — Paiement, rapprochement et reçu

## Principes

Le paiement reçu, son rapprochement, sa confirmation et l’émission du reçu sont des états distincts. L’interface ne doit jamais les confondre.

## Écran opérationnel

1. Liste des paiements entrants avec canal, référence et statut.
2. Détail de la transaction immuable.
3. Sélection membre/cotisation/période.
4. Affectation complète ou partielle.
5. Contrôle du reste à affecter.
6. Commentaire et justification en cas d’exception.
7. Confirmation selon habilitation.
8. Aperçu du reçu uniquement lorsque les préconditions sont remplies.
9. Piste d’audit.

## Garde-fous

- Clé d’idempotence visible dans les diagnostics, pas nécessairement pour l’utilisateur métier.
- Montant affecté ≤ montant reçu sauf règle documentée.
- Un paiement déjà confirmé ne peut pas être confirmé une seconde fois.
- Une correction produit une opération compensatrice.
- Une différence de frais ou de devise est explicitée.
- Le reçu officiel est généré au nom du CNPM après confirmation.

## Accessibilité

Les montants sont lus avec unité ; le statut n’est pas uniquement coloré ; l’aperçu PDF possède un lien de téléchargement et un résumé textuel.
