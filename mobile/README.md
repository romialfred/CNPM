# Application mobile CNPM

Socle Flutter 3.44 pour l'expérience membre. Le premier lot couvre :

- `MOB-001` — connexion mobile de démonstration ;
- `MOB-002` — vérification 2FA de démonstration ;
- le routeur déclaratif et le shell membre responsive à cinq destinations.

## Architecture

Le code sépare `app`, `design_system` et `features`. La feature `auth` isole la
présentation, les cas d'usage, le domaine et l'infrastructure. `AuthGateway` ne
transporte jamais de mot de passe : un futur adaptateur pourra piloter le flux
OIDC Authorization Code avec PKCE et retourner une session ou une étape 2FA sans
modifier le domaine.

Le profil normal est fermé par défaut. Tant que le client Keycloak n'est pas
livré, il affiche une connexion indisponible ; il ne se replie jamais vers les
fixtures.

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

Les tests couvrent les validations, les erreurs neutres, le profil fermé, le
parcours 2FA, la sémantique, les cibles tactiles et le zoom 200 %. Les goldens de
`test/golden/goldens/` figent MOB-001 et MOB-002 à 360, 390 et 430 px.

## Sources normatives

- `../docs/ui-handoff/START_HERE.md`
- `../docs/ui-handoff/docs/04-screens/reference-specs/ref-mob-001-mobile.md`
- `../docs/ui-handoff/docs/07-implementation/flutter-architecture.md`
- `../docs/05-security/security-requirements.md`
