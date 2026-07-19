import 'package:flutter_test/flutter_test.dart';

import 'package:cnpm_mobile/core/presentation/content_controller.dart';

void main() {
  test('publie un contenu prêt', () async {
    final controller = ContentController<List<String>>(
      load: () async => ['contenu'],
      isEmpty: (value) => value.isEmpty,
    );
    addTearDown(controller.dispose);

    await controller.ensureLoaded();

    expect(controller.phase, ContentPhase.ready);
    expect(controller.value, ['contenu']);
  });

  test('distingue un résultat vide', () async {
    final controller = ContentController<List<String>>(
      load: () async => [],
      isEmpty: (value) => value.isEmpty,
    );
    addTearDown(controller.dispose);

    await controller.ensureLoaded();

    expect(controller.phase, ContentPhase.empty);
    expect(controller.value, isEmpty);
  });

  test('reste récupérable après une indisponibilité', () async {
    var isAvailable = false;
    final controller = ContentController<List<String>>(
      load: () async {
        if (!isAvailable) {
          throw StateError('indisponible');
        }
        return ['repris'];
      },
      isEmpty: (value) => value.isEmpty,
    );
    addTearDown(controller.dispose);

    await controller.ensureLoaded();
    expect(controller.phase, ContentPhase.failure);

    isAvailable = true;
    await controller.reload();

    expect(controller.phase, ContentPhase.ready);
    expect(controller.value, ['repris']);
  });
}
