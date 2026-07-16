# Dates, nombres et monnaie

## Monnaie

La devise de base est XOF. L’interface peut afficher `FCFA` si le CNPM le préfère, mais le choix doit être cohérent par écran et document.

```ts
new Intl.NumberFormat('fr-ML', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
}).format(amount);
```

Pour une table dense, un format contrôlé `12 500 000 FCFA` est acceptable. Le texte accessible doit inclure l’unité.

## Dates

- API : ISO 8601.
- Date compacte : `27/05/2024`.
- Date éditoriale : `27 mai 2024`.
- Date/heure : `27 mai 2024 à 11:23`.
- Plage : `du 1er janvier au 27 mai 2024`.

## Durées relatives

Les libellés « il y a 5 min » ont un `title` ou texte accessible avec la date exacte. Les tests visuels utilisent des dates fixes.

## Téléphone

Format lisible : `+223 20 22 00 57`. Conserver une version normalisée E.164 dans les données.
