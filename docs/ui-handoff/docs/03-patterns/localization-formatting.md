# Pattern — Localisation et formats

## Locale

Locale primaire : `fr-ML`. Préparer l’architecture i18n pour anglais et autres langues validées.

## Montants

- Modèle : unités mineures ou `Decimal`, jamais float.
- Affichage recommandé : `12 500 000 FCFA` ou `12 500 000 XOF`, sans mélange dans un même écran.
- Zéro : `0 FCFA`.
- Montants négatifs : signe moins explicite et contexte.

## Dates

- Tableau dense : `27/05/2024`.
- Contenu éditorial : `27 mai 2024`.
- Date/heure : `27 mai 2024 à 11:23`.
- Stockage et API : ISO 8601 avec fuseau.

## Nombres

Espace fine insécable pour milliers lorsque le moteur le permet. Pourcentage : une décimale par défaut (`78,4 %`).

## Noms propres

Conserver accents et casse officielle. Les slugs sont ASCII, stables et uniques.
