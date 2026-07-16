# Placement exact des fichiers Markdown

## Fichiers autorisés à la racine

La racine du dépôt contient exactement les fichiers Markdown transversaux suivants :

```text
CNPM_Final/
├── CLAUDE.md
├── AGENTS.md
├── START_HERE.md
├── README.md
├── PLANS.md
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
├── NOTICE.md
└── MANIFEST.md
```

### Rôle de chaque fichier

| Fichier | Rôle |
|---|---|
| `CLAUDE.md` | Instructions persistantes chargées par Claude Code pour tout le dépôt |
| `AGENTS.md` | Instructions persistantes de niveau dépôt pour Codex et autres agents |
| `START_HERE.md` | Ordre de lecture et procédure de démarrage |
| `README.md` | Présentation, périmètre, état, arborescence et commandes |
| `PLANS.md` | Séquence de réalisation par releases |
| `CONTRIBUTING.md` | Règles de contribution et de revue |
| `SECURITY.md` | Politique de sécurité et signalement |
| `CHANGELOG.md` | Historique des baselines du dépôt |
| `NOTICE.md` | Propriété, confidentialité et limites d’utilisation des actifs |
| `MANIFEST.md` | Fonctionnement du manifeste SHA-256 |

`CLAUDE.local.md.example` reste également à la racine comme modèle. Il n’est pas chargé comme instruction locale tant qu’un développeur ne le copie pas en `CLAUDE.local.md`, fichier ignoré par Git.

## Fichiers qui ne doivent pas être remontés à la racine

- règles thématiques Claude : `.claude/rules/*.md` ;
- workflows réutilisables : `.claude/skills/*/SKILL.md` ;
- agents spécialisés : `.claude/agents/*.md` ;
- documents métier et techniques : `docs/<domaine>/` ;
- rapports de validation et de réorganisation : `docs/00-governance/` ;
- fiches d’écran et règles UI : `docs/ui-handoff/` ;
- documentation propre au backend, au Web ou au mobile : `backend/README.md`, `web/README.md`, `mobile/README.md`.

Le validateur `scripts/validate-pack.py` vérifie automatiquement cette liste et refuse tout Markdown supplémentaire mal placé à la racine.
