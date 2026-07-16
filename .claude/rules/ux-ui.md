---
paths:
  - "web/**/*.html"
  - "web/**/*.scss"
  - "web/**/*.ts"
  - "mobile/**/*.dart"
---
# UX/UI CNPM

- La source normative est `docs/ui-handoff/` ; les PNG sont directionnels et ne remplacent jamais les spécifications ni les tokens.
- Surfaces principalement blanches ou neutres ; aucun grand cadre coloré, panneau saturé, glassmorphism, dégradé gratuit ou ombre lourde.
- Bleu principal `#273481` ; rouge `#E40C20` réservé aux CTA publics, accents de marque et actions réellement critiques.
- Hauteur standard Web : 40 px ; cible tactile : 44 à 48 px ; rayon de contrôle : 8 px ; rayon de carte : 12 px.
- Shell desktop : sidebar 252 px, topbar 72 px, marge de page 28 px selon les breakpoints documentés.
- Utiliser les bordures avant les ombres et les cartes uniquement pour un regroupement sémantique.
- Une action primaire dominante par zone fonctionnelle.
- Un seul `h1` par page et hiérarchie de titres logique.
- Un statut n’est jamais transmis uniquement par la couleur.
- Prévoir chargement, vide, aucun résultat, erreur, accès interdit, succès, hors ligne et synchronisation.
- Préserver les saisies lors des erreurs de validation ou de réseau.
- Utiliser le formatage `fr-ML` et les fixtures déterministes du handoff.
- Ne pas recopier les incohérences de chiffres ou de libellés visibles dans les images générées.
- Ne jamais reproduire un écran par mise à l’échelle globale ou positionnement absolu de toute la page.
