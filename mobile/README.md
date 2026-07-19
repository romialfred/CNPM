# Application mobile CNPM

Socle Flutter 3.44 pour l'expérience membre. Les lots livrés couvrent :

- `MOB-001` — connexion mobile de démonstration ;
- `MOB-002` — vérification 2FA de démonstration ;
- `MOB-003` — accueil membre sans KPI administratifs ni barème inventé ;
- `MOB-008` — historique des paiements en lecture, sans confirmation fictive ;
- `MOB-011` — liste des requêtes sans notes internes ni SLA inventé ;
- le routeur déclaratif et le shell membre responsive à cinq destinations.

## Architecture

Le code sépare `app`, `design_system` et `features`. La feature `auth` isole la
présentation, les cas d'usage, le domaine et l'infrastructure. `AuthGateway` ne
transporte jamais de mot de passe : un futur adaptateur pourra piloter le flux
OIDC Authorization Code avec PKCE et retourner une session ou une étape 2FA sans
modifier le domaine.

Les profils normaux sont fermés par défaut. Tant que le client Keycloak et les
schémas de réponse typés des routes portail ne sont pas livrés, ils affichent une
source indisponible ; ils ne se replient jamais vers les fixtures. Les contrats
`/portal/dashboard`, `/portal/payments` et `/service-requests` existent, mais
retournent encore les enveloppes génériques `Resource`/`PageResource`, ce qui ne
permet pas de construire un mapping HTTP de production sans invention.

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
`test/golden/goldens/` figent MOB-001, MOB-002, MOB-003, MOB-008 et MOB-011 à ces
trois largeurs.

## Sources normatives

- `../docs/ui-handoff/START_HERE.md`
- `../docs/ui-handoff/docs/04-screens/reference-specs/ref-mob-001-mobile.md`
- `../docs/ui-handoff/docs/07-implementation/flutter-architecture.md`
- `../docs/05-security/security-requirements.md`
