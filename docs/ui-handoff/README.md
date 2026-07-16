# Handoff UI/UX CNPM — intégré

Référence normative pour l’implémentation Web et mobile de la plateforme CNPM avec Claude Code, Codex ou une équipe de développement.

Le handoff convertit les visuels conceptuels en tokens, catalogue de composants, règles responsive, états, inventaire de 101 écrans, données de démonstration, contrats de vitrine publique, tests visuels et critères d’accessibilité.

## Démarrage
1. Lire `START_HERE.md`.
2. Utiliser les instructions racine `CLAUDE.md` ou `AGENTS.md`.
3. Importer les tokens depuis `design-tokens/`.
4. Implémenter le shell, les composants P0 et les quatre écrans pilotes.
5. Exécuter accessibilité et régression visuelle avant validation.

## Contenu
| Dossier | Usage |
|---|---|
| `docs/` | Spécifications UX/UI normatives |
| `design-tokens/` | Sources et formats générés Web, TypeScript, Flutter et ECharts |
| `assets/` | Placeholders et références visuelles |
| `data/` | Inventaires, fixtures, schémas JSON et décisions |
| `prototype/` | Aperçu HTML local |
| `tests/` | Exemples de tests visuels et d’accessibilité |
| `templates/` | Modèles de fiche écran, composant et revue UX |
| `workbooks/` | Matrice de handoff |
| `guide/` | Guide Word et PDF |
| `scripts/` | Validation, manifeste et comparaison d’images |

Les fondations d’intégration sont déjà présentes dans `.claude/`, `web/` et `mobile/` à la racine du dépôt. Aucun overlay supplémentaire ne doit être copié.

## Principes non négociables
- Surfaces majoritairement blanches ou neutres.
- Aucun grand panneau coloré décoratif, glassmorphism ou ombre lourde.
- Bleu `#273481` principal ; rouge `#E40C20` réservé aux accents et actions critiques.
- Statut jamais transmis par la couleur seule.
- Les PNG sont directionnels ; tokens, patterns et fiches écran priment.
- Aucune donnée réelle, signature, cachet, QR code ou photographie non autorisée.
