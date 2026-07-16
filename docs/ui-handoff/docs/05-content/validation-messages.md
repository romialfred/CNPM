# Catalogue de messages de validation

| Code | Message utilisateur |
|---|---|
| REQUIRED | Ce champ est obligatoire. |
| INVALID_EMAIL | Saisissez une adresse e-mail valide. |
| INVALID_PHONE | Saisissez un numéro de téléphone valide. |
| INVALID_DATE | Saisissez une date valide. |
| DATE_IN_PAST_NOT_ALLOWED | La date doit être aujourd’hui ou ultérieure. |
| DATE_RANGE_INVALID | La date de fin doit être postérieure à la date de début. |
| AMOUNT_POSITIVE | Le montant doit être supérieur à zéro. |
| AMOUNT_EXCEEDS_AVAILABLE | Le montant dépasse le solde disponible. |
| RCCM_INVALID | Le numéro RCCM n’est pas reconnu. Vérifiez la saisie. |
| NIF_INVALID | Le NIF n’est pas valide. Vérifiez la saisie. |
| DUPLICATE_MEMBER | Une entreprise avec ces identifiants existe déjà. |
| FILE_TOO_LARGE | Le fichier dépasse la taille maximale autorisée. |
| FILE_TYPE_NOT_ALLOWED | Ce format de fichier n’est pas autorisé. |
| FILE_SCAN_FAILED | Le fichier n’a pas pu être vérifié. Réessayez avec un autre fichier. |
| ALT_TEXT_REQUIRED | Décrivez l’image pour les personnes qui ne peuvent pas la voir. |
| SLUG_UNAVAILABLE | Cette adresse est déjà utilisée. Choisissez-en une autre. |
| SESSION_EXPIRED | Votre session a expiré. Reconnectez-vous pour continuer. |
| FORBIDDEN | Vous n’avez pas l’autorisation d’effectuer cette action. |
| NETWORK | La connexion a été interrompue. Vérifiez votre réseau puis réessayez. |
| CONFLICT | Ces informations ont été modifiées par un autre utilisateur. Actualisez avant de continuer. |

Le backend renvoie un code stable et des paramètres ; le frontend construit le message localisé. Ne pas afficher la stack technique.
