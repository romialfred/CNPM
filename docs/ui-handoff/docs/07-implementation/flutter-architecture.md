# Architecture UI mobile — Flutter

## Structure

```text
mobile/lib/
├── app/
├── core/                 # réseau, stockage, auth, analytics, erreurs
├── design_system/        # thème, tokens, widgets
├── features/
│   ├── auth/
│   ├── home/
│   ├── contributions/
│   ├── payments/
│   ├── receipts/
│   ├── requests/
│   ├── documents/
│   └── profile/
└── l10n/
```

## Principes

- Une source de vérité pour tokens et thème.
- Widgets du design system indépendants des repositories métier.
- Navigation déclarative et routes profondes si nécessaire.
- Stockage local chiffré pour jetons ; données hors connexion minimales et classifiées.
- File de synchronisation idempotente, visible et testée.
- États `loading/data/empty/error/offline` explicites.
- Respect de `MediaQuery.textScaler`, safe areas et contrastes.

## Tests

- Golden tests pour composants stables et écrans clés.
- Semantics tests.
- Widget tests des formulaires et erreurs.
- Integration tests des parcours P0 sur tailles 360, 390 et 430.
