import 'package:flutter/foundation.dart';

enum ContentPhase { idle, loading, ready, empty, failure }

typedef ContentLoader<T> = Future<T> Function();
typedef EmptyContentPredicate<T> = bool Function(T value);

final class ContentController<T> extends ChangeNotifier {
  ContentController({
    required ContentLoader<T> load,
    required EmptyContentPredicate<T> isEmpty,
  }) : _load = load,
       _isEmpty = isEmpty;

  final ContentLoader<T> _load;
  final EmptyContentPredicate<T> _isEmpty;

  ContentPhase _phase = ContentPhase.idle;
  T? _value;

  ContentPhase get phase => _phase;
  T? get value => _value;

  Future<void> ensureLoaded() async {
    if (_phase != ContentPhase.idle) {
      return;
    }
    await reload();
  }

  Future<void> reload() async {
    _phase = ContentPhase.loading;
    _value = null;
    notifyListeners();

    try {
      final value = await _load();
      _value = value;
      _phase = _isEmpty(value) ? ContentPhase.empty : ContentPhase.ready;
    } on Object {
      _phase = ContentPhase.failure;
      _value = null;
    }
    notifyListeners();
  }

  void reset() {
    _phase = ContentPhase.idle;
    _value = null;
    notifyListeners();
  }
}
