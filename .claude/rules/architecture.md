# Règles d’architecture
- Le système démarre en monolithe modulaire, pas en microservices.
- Chaque module expose une API applicative explicite et possède son modèle interne.
- Les dépendances sont orientées vers le domaine ; les frameworks restent en périphérie.
- Les transactions sont courtes et cohérentes à l’intérieur d’un module.
- Les processus intermodules longs utilisent événements, sagas ou BPMN, jamais une transaction distribuée.
- Toute exception à une frontière de module nécessite un ADR.
