# MP-015 — Éditeur de vitrine membre

**Route :** `/member/showcase/edit`  
**Rôle principal :** Administrateur du compte membre

## Structure

Deux colonnes sur desktop : navigation des sections 280 px, formulaire flexible, aperçu facultatif à droite dans un drawer. Les sections sont Identité, Hero, À propos, Activités, Réalisations, Galerie, Certifications, Documents, Actualités, Contacts, SEO et Publication.

## Fonctions obligatoires

- autosauvegarde horodatée ;
- état brouillon / en revue / approuvé / publié / rejeté ;
- ordre de sections contrôlé ;
- champs obligatoires et limites éditoriales ;
- upload avec droits, alt text et point focal ;
- aperçu desktop, tablette et mobile ;
- aperçu SEO et partage social ;
- soumission à modération ;
- historique de versions et restauration ;
- confirmation avant dépublication.

## Critères

- [ ] Le membre ne peut modifier le badge de vérification.
- [ ] Les coordonnées publiées sont consenties.
- [ ] Les images sans texte alternatif ne peuvent être soumises si informatives.
- [ ] Un brouillon est récupérable après fermeture.
- [ ] La publication utilise le schéma `data/member-showcase.schema.json`.
- [ ] Les sections non renseignées ne sont pas rendues publiquement.
