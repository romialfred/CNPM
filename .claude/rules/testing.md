# Tests
- Chaque exigence possède au minimum un scénario nominal et un scénario de contrôle négatif.
- Chaque exigence financière, de sécurité, de données ou d’intégration possède en plus un test de répétition, concurrence, idempotence ou intégrité selon le risque.
- Chaque règle métier transversale possède un scénario dédié et traçable.
- Les bugs financiers, de sécurité et de permissions exigent un test de non-régression.
- Les migrations sont testées depuis une base vide et depuis la version précédente.
- Les tests E2E restent ciblés sur les parcours critiques ; les règles détaillées vivent dans les tests de domaine et d’intégration.
- Ne pas utiliser de données personnelles réelles.
