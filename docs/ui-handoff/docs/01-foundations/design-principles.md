# Principes de design CNPM

## 1. Institutionnel sans austérité

L’interface doit inspirer confiance et maîtrise sans être lourde. La marque s’exprime par la typographie, la rigueur de la grille, le bleu institutionnel et quelques accents rouges, non par des panneaux colorés omniprésents.

## 2. Contenu avant décoration

Les données, statuts, échéances et prochaines actions doivent être compris en moins de quelques secondes. Toute décoration sans fonction est supprimée. Les cartes existent uniquement lorsqu’elles regroupent un objet ou une action clairement identifiable.

## 3. Une action dominante

Chaque zone fonctionnelle possède une action primaire unique. Les actions secondaires sont bordées ou textuelles ; les actions dangereuses restent distinctes et demandent confirmation.

## 4. Densité maîtrisée

Le back-office accepte une densité supérieure au site public. Les tableaux, filtres et formulaires utilisent une grille régulière, des alignements stricts et des hauteurs de contrôle cohérentes. La densité compacte n’est appliquée qu’aux utilisateurs fréquents et ne réduit jamais les cibles tactiles sous les minima accessibles.

## 5. Transparence des états

Chargement, validation, erreur, attente, synchronisation et permissions sont explicites. Une action financière ne peut jamais sembler terminée avant confirmation serveur.

## 6. Identité commune, contextes distincts

- **Public** : éditorial, crédible, orienté découverte et conversion.
- **Back-office** : précis, dense, orienté tâche et contrôle.
- **Portail membre** : guidé, rassurant, orienté libre-service.
- **Mobile** : actions essentielles, contexte réduit, synchronisation visible.

Les quatre contextes partagent tokens, iconographie, états et vocabulaire.

## 7. Accessibilité native

Le clavier, le lecteur d’écran, le zoom à 200 %, le contraste et les préférences de mouvement sont pris en charge dès le composant, non ajoutés en fin de projet.

## 8. Résilience réseau

Les opérations sensibles affichent leur état, les erreurs sont récupérables, et le mobile distingue clairement « enregistré localement », « en synchronisation » et « confirmé par le serveur ».

## 9. Données cohérentes

Les valeurs de démonstration viennent de `data/demo-fixtures.json`. Les captures ne doivent pas introduire de totaux contradictoires. Les statuts métier utilisent les vocabulaires normalisés du pack.

## 10. Fidélité mesurée

La fidélité n’est pas évaluée à l’œil uniquement. Elle est contrôlée par viewports fixes, captures Playwright, seuils de différence, tests d’accessibilité et revue UX.
