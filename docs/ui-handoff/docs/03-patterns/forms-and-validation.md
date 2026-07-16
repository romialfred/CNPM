# Pattern — Formulaires et validation

## Structure

1. Titre et objectif.
2. Contexte et prérequis.
3. Sections logiques de 4 à 8 champs.
4. Aides et documents attendus.
5. Résumé avant soumission si l’action est engageante.
6. Barre d’actions stable.

## Formulaire multi-étapes

- Conserver l’état à chaque étape.
- Autoriser « Enregistrer le brouillon ».
- Ne pas empêcher la navigation vers une étape précédente.
- Indiquer étapes complètes, erreurs et étape courante.
- À la reprise, revenir à la première étape incomplète.
- La soumission finale affiche les déclarations, conséquences et documents.

## Erreurs

- Résumé en haut du formulaire après soumission.
- Message spécifique sous chaque champ.
- Focus sur le résumé, puis liens vers les champs.
- Ne jamais vider les champs valides.
- Une erreur serveur est distinguée d’une erreur de validation locale.

## Confirmation

- Action financière : récapitulatif montant, membre, période et canal.
- Publication publique : aperçu, visibilité, date et responsabilité du contenu.
- Suppression : nom de l’objet et conséquence irréversible.
