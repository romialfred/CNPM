# Module Vitrine publique des membres

Ce dossier formalise l’exigence additionnelle de vitrine publicitaire demandée pour chaque membre du CNPM. Il complète le handoff UI/UX et évite que Claude Code ou Codex invente le modèle, les routes ou les permissions.

## Statut

- Le **périmètre fonctionnel** est retenu pour la release R4.
- Le **socle technique** ci-dessous est la baseline de conception.
- La publication en production reste conditionnée aux décisions `UX-DEC-003` à `UX-DEC-008` : droits médias, badge vérifié, modération, URL, langues et cartographie.
- L’OpenAPI principal et les migrations Flyway ne doivent être modifiés qu’au démarrage du lot R4, dans une pull request traçable qui applique `promotion-checklist.md`.

## Documents

- `requirements.md` — comportements et règles de gestion ;
- `data-model.md` — modèle PostgreSQL proposé ;
- `api-addendum.yaml` — contrat API de référence du module ;
- `permissions.md` — permissions et séparation des tâches ;
- `acceptance-tests.md` — recette fonctionnelle et sécurité ;
- `promotion-checklist.md` — procédure d’intégration dans les contrats canoniques.

## Références UI

- `docs/ui-handoff/docs/03-patterns/public-member-showcase.md`
- `docs/ui-handoff/docs/05-content/public-showcase-content.md`
- `docs/ui-handoff/data/member-showcase.schema.json`
- écran `PUB-006` dans l’inventaire des écrans.
