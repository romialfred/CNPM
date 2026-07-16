# Plan de migration des données

## Étapes
1. Inventaire et profilage des sources existantes.
2. Définition des règles de correspondance et de priorité.
3. Normalisation NIF, RCCM, téléphones, courriels, secteurs et groupements.
4. Détection des doublons avec rapport de décision.
5. Chargement à blanc, contrôles de volumétrie et rapprochement financier.
6. Validation métier par échantillon puis validation globale.
7. Gel, extraction finale, chargement, delta et bascule.
8. Rapport d’intégrité et conservation des preuves.

## Règles
- aucune donnée source n’est détruite ;
- toute transformation est traçable ;
- les valeurs rejetées sont isolées avec motif ;
- les paiements et soldes sont réconciliés avec les états CNPM ;
- les données personnelles sont chiffrées pendant les transferts.
