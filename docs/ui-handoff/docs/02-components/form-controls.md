# Contrôles de formulaire

## Anatomie obligatoire

1. Label persistant.
2. Indicateur obligatoire si applicable.
3. Contrôle.
4. Aide contextuelle facultative.
5. Erreur liée au contrôle.
6. Compteur ou format attendu si nécessaire.

## États

Chaque contrôle doit couvrir : vide, saisi, focus, erreur, succès si utile, désactivé, lecture seule et chargement pour les autocomplétions.

## Validation

- Valider le format à la sortie du champ ou lors de la soumission, pas à chaque frappe pour des erreurs agressives.
- Le résumé d’erreurs reçoit le focus après échec de soumission et propose des liens vers les champs.
- Conserver la saisie après erreur réseau.
- Les montants sont saisis sans symbole dans le champ et formatés de manière lisible ; le modèle stocke une valeur numérique.
- Les dates acceptent saisie clavier et calendrier.
- Le téléphone sépare indicatif et numéro si nécessaire.

## Largeurs

- Champ court (code, année) : 160–220 px.
- Champ moyen (nom, téléphone) : 280–420 px.
- Champ long (adresse, objet) : largeur de colonne.
- Textarea : 4 lignes minimum, redimensionnement vertical autorisé sur Web.

## Upload

Le composant indique types, taille, nombre de fichiers, progression, analyse de sécurité, succès ou rejet. La zone de glisser-déposer est doublée d’un bouton clavier.
