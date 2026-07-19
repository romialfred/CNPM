# Goldens MOB-001, MOB-002, MOB-003, MOB-008 et MOB-011

Les quinze PNG couvrent les largeurs normatives 360, 390 et 430 px. Ils sont
produits par `flutter_test`, qui utilise la fonte Ahem déterministe : les glyphes
sont volontairement représentés par des blocs pour stabiliser les différences de
mise en page entre environnements. Les libellés réels sont contrôlés par les tests
widget et sémantiques.

Régénération après revue UI :

```powershell
flutter test --no-pub --update-goldens test/golden/auth_screens_golden_test.dart
flutter test --no-pub --update-goldens test/golden/member_screens_golden_test.dart
```

Ces goldens verrouillent le rendu technique. Leur promotion comme baseline UX
reste soumise à la revue visuelle prévue par le handoff.
