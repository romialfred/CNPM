# Bibliothèque de prompts

## Implémenter un composant

```text
Implémente [COMPONENT_ID / NOM] selon le catalogue CNPM. Utilise exclusivement les tokens.
Couvre toutes les variantes et états, Storybook, interactions, axe, clavier et snapshot.
N’ajoute aucune variante non documentée. Signale toute ambiguïté.
```

## Implémenter un écran

```text
Implémente [SCREEN_ID] à partir de sa fiche normative et de la référence [REF_ID].
Commence par un plan de composition et la liste des composants. Utilise les fixtures.
Teste 360/390/430, 768/1024, 1280/1440/1672 selon pertinence. Capture et compare.
```

## Revue de fidélité

```text
Compare l’implémentation de [SCREEN_ID] à la référence et aux tokens. Classe les écarts :
structure, dimensions, typographie, couleur, contenu, état, responsive, accessibilité.
Corrige d’abord les écarts structurels, puis les espacements et enfin les détails.
Ne masque pas un défaut par un seuil ou un screenshot mask.
```

## Revue vitrine membre

```text
Vérifie l’éditeur, l’aperçu, la modération et la page publique de vitrine membre.
Contrôle droits médias, SEO, badge, sections vides, contact, responsive, performance,
accessibilité, statut de publication et audit.
```

## Revue accessibilité

```text
Exécute axe, puis un parcours clavier. Vérifie titres, landmarks, focus, labels, erreurs,
dialogues, tables, graphiques, zoom/reflow et réduction du mouvement. Donne des preuves.
```
