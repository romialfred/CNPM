# Design tokens

La source est `design-tokens/tokens.source.json`. Les fichiers CSS, SCSS, TypeScript, Flutter et ECharts sont générés à partir de cette source.

## Règles

- Ne jamais écrire une couleur hexadécimale directement dans un composant, sauf actif de marque exceptionnel documenté.
- Ne jamais créer une nouvelle valeur d’espacement pour résoudre localement un problème de mise en page.
- Toute modification de token exige revue UX et régénération des baselines.
- Les tokens sémantiques (`text.primary`, `surface.page`, `border.default`) sont préférés aux tokens de palette (`brand.blue.700`).
- Les composants ne doivent pas dépendre du mode clair/sombre directement ; ils consomment les tokens sémantiques. La version 1.0 ne prévoit pas de thème sombre de production.

## Palette fonctionnelle

| Usage | Token | Valeur |
|---|---|---|
| Action primaire | `color.brand.blue.700` | `#273481` |
| Action primaire hover | `color.brand.blue.800` | `#1D286C` |
| CTA public / critique | `color.brand.red.600` | `#E40C20` |
| Fond de page | `color.surface.page` | `#F8F9FC` |
| Surface | `color.surface.primary` | `#FFFFFF` |
| Texte principal | `color.text.primary` | `#101828` |
| Texte secondaire | `color.text.secondary` | `#475467` |
| Bordure | `color.border.default` | `#D0D5DD` |
| Succès | `color.semantic.success.600` | `#039855` |
| Avertissement | `color.semantic.warning.600` | `#DC6803` |
| Erreur | `color.semantic.error.600` | `#D92D20` |
| Information | `color.semantic.info.600` | `#1570EF` |

## Espacement

Base 4 px. Les valeurs usuelles sont 8, 12, 16, 20, 24, 32 et 40 px. L’espacement de 28 px est réservé au padding de page desktop, conformément aux références.

## Rayons

- Contrôles : 8 px.
- Cartes : 12 px.
- Dialogues et panneaux importants : 16 px maximum.
- Badges : rayon « pill ».

Des rayons excessifs donnent un aspect grand public incompatible avec le back-office institutionnel.

## Ombres

Utiliser prioritairement une bordure fine. L’ombre `sm` peut renforcer les éléments superposés ; `md` est réservée aux menus, drawers et dialogues. Aucune ombre décorative sur les tableaux.

## Densités

- `comfortable` par défaut : contrôles 40 px.
- `compact` pour tables et outils experts : contrôles 36 px, uniquement desktop.
- `touch` : contrôles 44 à 48 px, mobile et tablette.
