# Données de test visuel

Les fixtures de `data/demo-fixtures.json` sont la source pour Storybook et Playwright. Elles sont fictives et cohérentes.

## Règles

- Pas de données de production.
- Pas de noms ou coordonnées réels sans autorisation.
- Dates fixes et fuseau UTC/GMT selon scénario.
- Références stables.
- Images locales ou interceptées.
- Tous les états doivent être constructibles sans modifier la base manuellement.

## Scénarios minimaux

- membre actif à jour ;
- membre partiellement payé ;
- dormant en retard ;
- prospect ;
- paiement non rapproché ;
- affectation partielle ;
- reçu émis ;
- requête ouverte ;
- vitrine brouillon, en revue, publiée, rejetée ;
- utilisateur sans permission ;
- réseau hors ligne mobile.
