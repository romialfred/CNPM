---
name: implement-screen
description: Implémenter un écran CNPM Web ou mobile à partir de son identifiant, du handoff UI/UX et des contrats métier.
disable-model-invocation: false
---
# Implement CNPM Screen

## Entrée

Un identifiant d’écran, par exemple `BO-002`, et éventuellement un identifiant de référence visuelle.

## Procédure

1. Lire la hiérarchie des sources et l’inventaire des écrans.
2. Ouvrir la fiche de l’écran et uniquement l’image de référence pertinente.
3. Identifier les composants existants et ceux à créer.
4. Vérifier tokens, responsive, accessibilité, permissions, données et états.
5. Signaler les ambiguïtés et proposer un plan court.
6. Implémenter avec des fixtures déterministes ou des API simulées.
7. Ajouter tous les états documentés.
8. Ajouter les tests et, si le gate de compatibilité est fermé, les stories Storybook ; sinon documenter les variantes dans le harness de composants prévu.
9. Exécuter lint, typage, tests d’interaction et axe.
10. Capturer les viewports obligatoires avec animations désactivées.
11. Comparer, corriger et documenter les écarts résiduels.
12. Ouvrir une décision pour tout contenu ou actif officiel manquant.

## Sortie

Fichiers modifiés, commandes et résultats, captures/diffs, résultat accessibilité, décisions ouvertes et checklist de conformité.
