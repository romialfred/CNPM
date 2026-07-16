# Régression visuelle

## Objectif

Détecter les changements involontaires tout en acceptant les différences inévitables d’anti-crénelage. Les captures ne remplacent pas les tests fonctionnels ou d’accessibilité.

## Viewports obligatoires

- Web : 1280×800, 1440×900, 1672×941.
- Tablette : 768×1024 et 1024×768.
- Mobile Web/Flutter : 360×800, 390×844, 430×932.

## Environnement déterministe

- navigateur et OS de CI figés ;
- animations désactivées ;
- police disponible avant capture ;
- fuseau et locale fixés ;
- date/heure mockées ;
- données de `demo-fixtures.json` ;
- réseau mocké ;
- aucune image aléatoire ;
- curseur et focus contrôlés.

## Seuils proposés

- Composant : `maxDiffPixelRatio` 0,001 à 0,003.
- Page : 0,005 maximum après masquage des zones réellement dynamiques.
- Tout changement de structure, texte, overflow ou focus est bloquant même sous le seuil.

Les seuils doivent être validés par QA/UX et ajustés par type de rendu.

## Baselines

1. Première implémentation comparée aux PNG conceptuels.
2. Après revue UX, la capture de l’application devient la baseline versionnée.
3. Les PNG conceptuels restent l’archive de direction artistique.
4. Une mise à jour de baseline exige justification et approbation.

## Masques autorisés

Horodatage relatif, avatar externe, carte tierce, QR réel, identifiant généré. Un masque ne doit pas cacher un composant entier ou un défaut de mise en page.
