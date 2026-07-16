# Modèle opératoire Claude Code

## Répartition du contexte
- `CLAUDE.md` : règles permanentes et concises.
- `.claude/rules/` : règles thématiques, certaines limitées à des chemins.
- `.claude/skills/` : procédures chargées à la demande.
- `.claude/agents/` : revues spécialisées et séparées.
- `.claude/hooks/` + `settings.json` : garde-fous exécutables.

## Cycle recommandé
1. Choisir une story dans le backlog et vérifier la Definition of Ready.
2. Invoquer `/implement-user-story` et travailler en plan avant toute modification structurante.
3. Exécuter les tests locaux et `make validate`.
4. Déléguer les revues architecture, base, API, sécurité et tests selon les impacts.
5. Mettre à jour la matrice de traçabilité et les décisions.
6. Produire une pull request avec preuves et risques résiduels.

## Limites
Claude Code n’arbitre pas les taux, partenaires, coordonnées bancaires, obligations juridiques ou décisions institutionnelles. Ces éléments nécessitent une validation humaine formelle.
