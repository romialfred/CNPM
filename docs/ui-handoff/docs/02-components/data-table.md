# Tableau de données

## Usage

Le tableau est réservé aux comparaisons de plusieurs objets partageant des colonnes. Pour un petit nombre d’objets ou sur mobile, utiliser `ResponsiveRecordList`.

## Anatomie

- titre/caption ;
- filtres et recherche séparés du tableau ;
- contrôle de colonnes ;
- barre d’actions groupées uniquement après sélection ;
- en-têtes triables explicitement ;
- première colonne d’identité stable ;
- montants alignés à droite ;
- actions de ligne regroupées ;
- pagination serveur et total ;
- état vide, aucun résultat, erreur et chargement.

## Densité

- Confortable : ligne 52–56 px.
- Compacte : ligne 44–48 px.
- En-tête : 44–48 px.
- Les lignes ne sont jamais réduites sous 40 px.

## Responsive

- À partir de 1024 px : tableau complet, colonnes secondaires configurables.
- 768–1023 px : défilement horizontal contrôlé ou colonnes prioritaires seulement.
- Sous 768 px : fiches empilées, avec identité, statut, montant principal et menu d’actions.

## Accessibilité

- `caption` ou nom accessible ;
- `th scope`; tri annoncé via `aria-sort` ;
- sélection par checkbox nommée ;
- action « sélectionner tout » limitée à la page ou explicitement globale ;
- la ligne entière ne devient pas un lien si elle contient déjà des contrôles interactifs.
