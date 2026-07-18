# Régression visuelle

## Objectif

Détecter les changements involontaires tout en acceptant les différences inévitables d’anti-crénelage. Les captures ne remplacent pas les tests fonctionnels ou d’accessibilité.

## Viewports obligatoires

- Web : 1280×800, 1440×900, 1672×941.
- Tablette : 768×1024 et 1024×768.
- Mobile Web/Flutter : 360×800, 390×844, 430×932.

## Environnement déterministe

- navigateur et OS de CI figés ;
- animations désactivées ;
- police disponible avant capture ;
- fuseau et locale fixés ;
- date/heure mockées ;
- données de `demo-fixtures.json` ;
- réseau mocké ;
- aucune image aléatoire ;
- curseur et focus contrôlés.

## Seuils proposés

- Composant : `maxDiffPixelRatio` 0,001 à 0,003.
- Page : 0,005 maximum après masquage des zones réellement dynamiques.
- Tout changement de structure, texte, overflow ou focus est bloquant même sous le seuil.

Les seuils doivent être validés par QA/UX et ajustés par type de rendu.

## Note de fidélité de reprise

La reprise premium ajoute une note déterministe sur 10 produite par
`scripts/compare_images.py`. Elle combine fidélité pixel, pixels significativement
différents, structure des contours et distribution colorimétrique. Le seuil de
livraison demandé est **9,8/10 minimum** sur la référence 1672×941, sans écart
structurel, textuel, responsive ou d'accessibilité bloquant.

```bash
python docs/ui-handoff/scripts/compare_images.py \
  docs/ui-handoff/assets/reference-screens/full/ref-bo-002-members-list.png \
  captures/REF-BO-002/1672x941.png \
  --out visual-diff/REF-BO-002 \
  --min-score 9.8
```

Une note supérieure au seuil ne suffit pas à elle seule : les tests Playwright, axe,
clavier, responsive et métier restent des gates indépendants. Inversement, le seuil
ne peut pas être abaissé pour faire passer un écran. Les masques sont réservés aux
petites zones dynamiques listées ci-dessous et doivent être documentés dans le rapport.

### Grille de revue UI complémentaire

Chaque écran reçoit aussi une note de conformité globale, indépendante du score pixel :

| Critère | Poids sur 10 |
|---|---:|
| Structure et composition normative | 2,0 |
| Tokens, espacements et typographie | 1,4 |
| Responsive et reflow | 1,4 |
| États et interactions | 1,4 |
| Accessibilité WCAG 2.2 AA | 1,5 |
| Cohérence du contenu et des données | 0,8 |
| Fidélité et preuves visuelles | 1,5 |

Chaque sous-critère reçoit `0`, `0,5` ou `1`. La livraison exige **9,8/10** sur
cette grille **et** au moins 9,8/10 au comparateur automatique. Les plafonds suivants
évitent qu'une moyenne masque un défaut important :

- aucune baseline approuvée : note globale plafonnée à 8,5 ;
- écart structurel, responsive ou fonctionnel majeur : note plafonnée à 8,9 ;
- blocage clavier ou accessibilité critique : note plafonnée à 6,9 ;
- un défaut critique ou majeur non résolu interdit toute promotion de baseline.

## Baselines

1. Première implémentation comparée aux PNG conceptuels.
2. Après revue UX, la capture de l’application devient la baseline versionnée.
3. Les PNG conceptuels restent l’archive de direction artistique.
4. Une mise à jour de baseline exige justification et approbation.

## Masques autorisés

Horodatage relatif, avatar externe, carte tierce, QR réel, identifiant généré. Un masque ne doit pas cacher un composant entier ou un défaut de mise en page.
