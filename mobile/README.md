# Application mobile CNPM

Socle Flutter 3.44 pour l'expérience membre. Les lots livrés couvrent :

- `MOB-001` — connexion mobile de démonstration ;
- `MOB-002` — vérification 2FA de démonstration ;
- `MOB-003` — accueil membre sans KPI administratifs ni barème inventé ;
- `MOB-008` — historique des paiements en lecture, sans confirmation fictive ;
- `MOB-011` — liste des requêtes sans notes internes ni SLA inventé ;
- `MOB-012` — création locale d’une requête fictive avec validation accessible et métadonnée de pièce sans téléversement ;
- `MOB-013` — détail et conversation fictive limités aux échanges explicitement partagés ;
- `MOB-014` — catalogue consultatif de métadonnées documentaires, sans fichier ni preuve officielle ;
- `MOB-015` — historique local fictif, sans notification externe ni état de lecture serveur ;
- le routeur déclaratif et le shell membre responsive à cinq destinations ;
- la destination `Plus` regroupe Documents, Notifications et le Profil encore indisponible.

## Architecture

Le code sépare `app`, `design_system` et `features`. La feature `auth` isole la
présentation, les cas d'usage, le domaine et l'infrastructure. `AuthGateway` ne
transporte jamais de mot de passe : un futur adaptateur pourra piloter le flux
OIDC Authorization Code avec PKCE et retourner une session ou une étape 2FA sans
modifier le domaine.

Les profils normaux sont fermés par défaut. Tant que le client Keycloak et les
schémas de réponse typés des routes portail ne sont pas livrés, ils affichent une
source indisponible ; ils ne se replient jamais vers les fixtures. Les contrats
`/portal/dashboard`, `/portal/payments`, `/portal/documents` et
`/service-requests` existent, mais retournent encore les enveloppes génériques
`Resource`/`PageResource`. Aucun endpoint REST ne fournit l’historique membre des
notifications. Ces limites empêchent un mapping HTTP de production sans invention.

## Lancer la démonstration

```powershell
flutter run --dart-define=CNPM_AUTH_MODE=demo
```

Le mode démo est explicitement signalé. Il accepte une adresse réservée se
terminant par `.invalid`, un mot de passe fictif d'au moins huit caractères et le
code public `123456`. Ces valeurs ne sont ni envoyées, ni journalisées, ni
persistées. Aucune session ou donnée membre réelle n'est utilisée.

## Validation

```powershell
flutter analyze --no-pub
flutter test --no-pub
```

Les tests couvrent les validations, les erreurs neutres, le profil fermé, les
états chargement/donnée/vide/erreur, les parcours authentifiés, la sémantique,
les cibles tactiles, le reflow 360/390/430 et le zoom 200 %. Les goldens de
`test/golden/goldens/` figent les écrans livrés, dont MOB-011 à MOB-015, à ces
trois largeurs.

## Sources normatives

- `../docs/ui-handoff/START_HERE.md`
- `../docs/ui-handoff/docs/04-screens/reference-specs/ref-mob-001-mobile.md`
- `../docs/ui-handoff/docs/07-implementation/flutter-architecture.md`
- `../docs/05-security/security-requirements.md`
