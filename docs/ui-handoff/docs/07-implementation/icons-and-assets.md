# Intégration des icônes et actifs

## Icônes

- Importer uniquement les icônes utilisées.
- Taille et trait normalisés par le wrapper `CnpmIcon`.
- Les icônes décoratives ont `aria-hidden="true"`.
- Les icônes informatives ont un nom accessible via le contrôle parent.

## Logo

Utiliser l’actif fourni comme référence ; remplacer par le SVG officiel dès réception. Le logo est un composant avec variantes de taille, pas une image copiée dans chaque feature.

## Images membre

- Service média centralisé.
- URL signée ou CDN selon architecture.
- `srcset`, dimensions explicites et placeholder pour éviter le layout shift.
- Point focal stocké dans les métadonnées.
- Alt text requis selon nature.

## PDF et documents

L’aperçu ne constitue pas la preuve officielle. Le téléchargement passe par une route autorisée et la réponse fixe type, nom et sécurité.
