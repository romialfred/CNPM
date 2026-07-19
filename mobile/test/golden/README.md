# Baselines MOB-001 et MOB-002

Les six PNG couvrent les largeurs normatives 360, 390 et 430 px. Ils sont
produits par `flutter_test`, qui utilise la fonte Ahem déterministe : les glyphes
sont volontairement représentés par des blocs pour stabiliser les différences de
mise en page entre environnements. Les libellés réels sont contrôlés par les tests
widget et sémantiques.

Régénération après revue UI :

```powershell
flutter test --no-pub --update-goldens test/golden/auth_screens_golden_test.dart
```
