# Pattern — Authentification et 2FA

## Connexion

La page distingue clairement « Espace administration » et « Espace membre » sans dupliquer le formulaire. Le retour d’erreur ne révèle pas si l’adresse existe.

## Champs

- Email avec `autocomplete="username"`.
- Mot de passe avec `autocomplete="current-password"`.
- Code OTP avec `autocomplete="one-time-code"` et collage global.
- Bouton afficher/masquer avec état accessible.

## 2FA

- TOTP/passkey recommandé pour profils sensibles ; SMS/email selon politique approuvée.
- Six cases visuelles peuvent correspondre à un seul champ logique.
- Le délai de renvoi est annoncé sans mise à jour vocale chaque seconde.
- Afficher méthodes alternatives et codes de secours si autorisés.

## Sécurité UX

- Pas de mot de passe dans URL, log ou analytics.
- Ne pas conserver l’email sur un terminal partagé sans consentement.
- Échec répété : message neutre, délai progressif et support.
- Session expirée : expliquer, préserver le brouillon local si sûr, puis retourner à la destination initiale.
