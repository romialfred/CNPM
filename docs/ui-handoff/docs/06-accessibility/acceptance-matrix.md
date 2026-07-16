# Matrice d’acceptation accessibilité

| Niveau | Contrôle | Outil / méthode | Gate |
|---|---|---|---|
| Composant | axe Storybook | addon axe / test runner | 0 critique/sérieuse |
| Page | axe Playwright | `@axe-core/playwright` | 0 critique/sérieuse |
| Clavier | scénario manuel | checklist | aucun blocage |
| Lecteur d’écran | NVDA + Chrome | manuel | parcours P0 compréhensible |
| Mobile | TalkBack / VoiceOver | manuel | parcours P0 compréhensible |
| Contraste | analyse tokens + inspection | outil + manuel | AA |
| Zoom/reflow | navigateurs | manuel | aucune perte |
| PDF officiels | contrôle PDF/UA selon cible | outil + manuel | décision projet |

Les résultats sont attachés à la pull request ou au rapport de recette.
