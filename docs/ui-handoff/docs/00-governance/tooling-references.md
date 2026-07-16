# Références d’outillage pour les agents de code

Le handoff est déjà intégré au dépôt ; aucun overlay supplémentaire ne doit être copié.

## Codex
Les instructions persistantes se trouvent dans `AGENTS.md` à la racine.

## Claude Code
Claude Code utilise `CLAUDE.md` à la racine, `.claude/settings.json`, les règles sous `.claude/rules/`, les agents sous `.claude/agents/` et les skills sous `.claude/skills/`.

## Sécurité
Ne transmettre à un agent ni secret, ni données réelles de membre, ni copie de production. Utiliser les fixtures déterministes de `docs/ui-handoff/data/`.
