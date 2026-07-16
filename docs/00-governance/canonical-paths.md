# Chemins canoniques du dépôt

| Contenu | Emplacement unique |
|---|---|
| TDR et spécifications signées | `docs/00-sources/` |
| Décisions, risques, glossaire et inventaire | `docs/00-governance/` |
| Backlog, règles métier et traçabilité | `docs/01-product/` |
| DCTD et architecture | `docs/02-architecture/` |
| Modèle et dictionnaire PostgreSQL | `docs/03-data/` |
| Migrations exécutables | `backend/src/main/resources/db/migration/` |
| OpenAPI et AsyncAPI canoniques | `docs/04-api/` |
| RBAC, sécurité et SoD | `docs/05-security/` |
| Référence UI/UX | `docs/ui-handoff/` |
| BPMN et machines d’état | `docs/07-processes/` |
| Intégrations | `docs/08-integrations/` |
| Stratégie et catalogues de tests | `docs/09-testing/` |
| Exploitation, sauvegarde et PRA | `docs/10-operations/` |
| Instructions agents détaillées | `.claude/` et `docs/11-claude-code/` |
| Addendum de conception de la vitrine R4 | `docs/12-member-showcase/` |
| CI/CD | `.gitlab-ci.yml` à la racine |

L’addendum vitrine n’est pas encore un contrat de production : il doit être promu dans l’OpenAPI, le RBAC et les migrations canoniques selon sa checklist au démarrage de R4.

Les anciens dossiers `BRS`, `Maquettes`, `Documents`, `Dossier Operatiionel`, `Dossier de conception technique`, `Specifications fonctionnelles` et le pack UI parallèle ont été supprimés après consolidation.
