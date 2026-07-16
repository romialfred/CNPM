# Application mobile CNPM

Socle Flutter pour l’expérience membre et les parcours terrain autorisés.

## Première initialisation

Le dépôt contient le code Dart, le thème, les tests et la configuration. Générer les runners natifs sur une machine disposant de Flutter 3.44.x :

```bash
cd mobile
flutter create --platforms=android,ios --org ml.cnpm --project-name cnpm_mobile .
flutter pub get
flutter analyze
flutter test
```

Les dossiers `android/` et `ios/` sont volontairement générés avec le SDK Flutter approuvé afin d’éviter de livrer des runners obsolètes.

## Sources UI

- `../docs/ui-handoff/START_HERE.md`
- `../docs/ui-handoff/docs/07-implementation/flutter-architecture.md`
- `../docs/ui-handoff/assets/reference-screens/full/ref-mob-001-mobile-board.png`
