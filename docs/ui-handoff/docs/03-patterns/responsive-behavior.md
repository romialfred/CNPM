# Comportement responsive

## Breakpoints normatifs

| Palier | Largeur | Comportement principal |
|---|---:|---|
| Petit mobile | 360–389 px | Une colonne, actions pleine largeur |
| Mobile | 390–479 px | Une colonne, bottom navigation |
| Grand mobile | 480–767 px | Une colonne large, sections groupées |
| Tablette portrait | 768–1023 px | Sidebar drawer, grilles 6 colonnes |
| Tablette paysage | 1024–1279 px | Sidebar réduite, panneaux secondaires repliables |
| Desktop | 1280–1439 px | Sidebar étendue, grille 12 colonnes |
| Desktop standard | 1440–1671 px | Disposition complète |
| Référence | 1672 px | Comparaison visuelle principale |
| Grand desktop | ≥ 1920 px | Contenu plafonné, pas d’étirement excessif |

## Règles communes

- Aucun zoom CSS global pour « faire rentrer » la référence.
- Les textes restent redimensionnables à 200 %.
- Les grilles passent de 12 à 6 puis 4 colonnes logiques.
- Les panneaux latéraux deviennent drawers ou sections sous le contenu.
- Les tables deviennent fiches sous 768 px.
- Les barres d’action se replient sans masquer l’action primaire.
- Les graphiques passent à une série visible ou à un carrousel ; le tableau alternatif reste disponible.
- Le site public réordonne hero : texte, CTA, image.
- Les vitrines membres conservent nom, badge, contact et activité principale avant les médias secondaires.

## Navigation

- Back-office mobile : sidebar en drawer ; topbar compacte.
- Portail membre mobile : bottom navigation à cinq destinations maximum.
- Public : bouton menu et CTA séparé.

## Formulaires

- Desktop : 2–3 colonnes selon champ.
- Tablette : 2 colonnes.
- Mobile : 1 colonne.
- Les actions sticky deviennent une barre basse avec prise en compte de la safe area.
