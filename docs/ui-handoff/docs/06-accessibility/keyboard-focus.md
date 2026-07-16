# Clavier et focus

## Ordre

L’ordre DOM suit l’ordre visuel. Éviter `tabindex` positif. Les contrôles masqués ne reçoivent pas le focus.

## Focus visible

Utiliser le token `shadow.focus` et une bordure compatible. Le focus ne dépend pas de la couleur seule. Les éléments sticky ne masquent pas l’élément focalisé.

## Composants

- Menu : flèches, Entrée/Espace, Échap.
- Tabs : flèches, Home/End, activation selon modèle choisi.
- Combobox : flèches, Entrée, Échap, saisie.
- Dialog : focus initial logique, piège, Échap, retour au déclencheur.
- DataTable : tabuler vers les contrôles, pas chaque cellule statique.
- Lightbox : navigation, fermeture, focus restauré.
- OTP : collage et suppression naturels ; pas six arrêts obligatoires si un champ logique suffit.
