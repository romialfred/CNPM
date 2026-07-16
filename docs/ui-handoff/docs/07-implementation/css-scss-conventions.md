# Conventions CSS/SCSS

## Nommage

Préfixe `cnpm-` pour les composants Web. Les classes utilitaires globales sont limitées et documentées.

```scss
.cnpm-button {}
.cnpm-button--primary {}
.cnpm-button__icon {}
```

## Ordre recommandé

1. position / display ;
2. dimensions ;
3. spacing ;
4. typography ;
5. colors / borders ;
6. visual effects ;
7. state selectors ;
8. media queries.

## Interdictions

- `!important` hors reset/accessibilité documentée ;
- valeurs magiques répétées ;
- marge négative pour alignement structurel ;
- `height` fixe sur contenu textuel ;
- zoom ou transform global pour imiter un screenshot ;
- couleurs de statut locales ;
- styles de focus supprimés sans remplacement.

## Container queries

Utilisables pour composants complexes lorsque support projet validé. Les breakpoints de page restent centralisés.
