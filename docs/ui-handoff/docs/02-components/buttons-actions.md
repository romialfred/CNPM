# Boutons et actions

## Variantes

| Variante | Usage | Couleur |
|---|---|---|
| Primary | Action principale d’une zone | Bleu CNPM |
| Public CTA | Conversion publique prioritaire | Rouge CNPM |
| Secondary | Action secondaire | Surface blanche, bordure neutre/bleue |
| Tertiary | Action faible ou locale | Texte/lien |
| Danger | Suppression, annulation irréversible | Rouge sémantique |
| Ghost | Barre d’outils dense | Transparent |

## Dimensions

- `sm` : 36 px, texte 14 px.
- `md` : 40 px, texte 14 px.
- `lg` : 44 px, texte 16 px.
- Mobile primaire : 48 px recommandé.
- Padding horizontal : 14–18 px selon taille.
- Icône : 16–20 px, espacement 8 px.

## Règles

- Une zone fonctionnelle comporte une seule action primaire.
- Un bouton possède toujours un verbe explicite.
- L’état `loading` conserve la largeur et expose `aria-busy`.
- Un bouton désactivé n’est pas utilisé pour masquer une règle : expliquer pourquoi si nécessaire.
- Une action destructive exige un dialogue avec conséquence, objet et option d’annulation.
- Les boutons iconiques ont une cible minimale de 40 × 40 px sur desktop et 44 × 44 px sur tactile.

## Ordre des actions

- Français, desktop : secondaire à gauche, primaire à droite.
- Mobile : primaire en pleine largeur, secondaire en dessous ou dans la barre supérieure selon le parcours.
- Ne pas placer deux boutons rouges côte à côte.
