# Hiérarchie des sources de vérité

En cas de contradiction, appliquer l’ordre suivant et ne jamais choisir arbitrairement :

1. TDR CNPM signé, avenants et décisions institutionnelles formellement approuvées.
2. Spécifications fonctionnelles CNPM v1.1 et règles métier associées.
3. Décisions et ADR acceptés dans le registre de gouvernance.
4. DCTD, architecture modulaire et modèle PostgreSQL validés.
5. Contrats OpenAPI/AsyncAPI, RBAC/SoD et processus BPMN validés.
6. Handoff UI/UX pour les interfaces : tokens, composants, patterns et fiches écran.
7. Backlog, matrice de traçabilité et cas de recette approuvés.
8. Code, migrations, configuration et captures de régression conformes aux éléments précédents.

## Addenda de conception

Les documents sous `docs/12-member-showcase/` sont une baseline de conception pour R4. Ils ne remplacent pas les contrats canoniques tant que la checklist de promotion n’a pas été exécutée dans une modification traçable.

## Règle de conflit

L’équipe ou l’agent arrête la modification concernée, consigne la divergence dans `docs/00-governance/open-decisions.md`, décrit les options et obtient une décision. Aucun agent ne doit inventer une règle métier, financière, juridique, de sécurité ou de marque.

## Références visuelles

Les PNG peuvent contenir des données fictives, des incohérences de totaux, des textes générés, des portraits ou actifs décoratifs et un seul état responsive. Ils servent à la composition et à la direction artistique. Les fiches écran et les tokens de `docs/ui-handoff/` corrigent ces ambiguïtés.
