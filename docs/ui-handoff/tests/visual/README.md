# Tests visuels

`reference-map.json` relie chaque référence conceptuelle à sa route. Les images conceptuelles servent au premier alignement. Après validation UX, les captures de l’application deviennent les baselines de non-régression.

## Procédure

1. Démarrer l’application avec mocks déterministes.
2. Fixer date, locale, fuseau et réseau.
3. Attendre le chargement des polices.
4. Désactiver les animations.
5. Capturer les viewports requis.
6. Comparer au PNG ou à la baseline.
7. Produire diff et rapport.

## Règles de masquage

Masquer uniquement les petites zones réellement dynamiques : horodatage relatif, carte tierce, QR officiel ou identifiant de transaction généré. Ne jamais masquer une carte entière, une table ou un panneau pour faire passer le test.
