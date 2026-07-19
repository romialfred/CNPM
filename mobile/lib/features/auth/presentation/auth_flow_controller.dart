import 'package:flutter/foundation.dart';

import 'package:cnpm_mobile/features/auth/application/start_demo_sign_in.dart';
import 'package:cnpm_mobile/features/auth/application/verify_second_factor.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_challenge.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_failure.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_start_result.dart';
import 'package:cnpm_mobile/features/auth/domain/member_session.dart';

enum AuthSubmission { idle, submitting }

final class AuthFlowController extends ChangeNotifier {
  AuthFlowController({
    required StartDemoSignIn startDemoSignIn,
    required VerifySecondFactor verifySecondFactor,
  }) : _startDemoSignIn = startDemoSignIn,
       _verifySecondFactor = verifySecondFactor;

  final StartDemoSignIn _startDemoSignIn;
  final VerifySecondFactor _verifySecondFactor;

  AuthSubmission _submission = AuthSubmission.idle;
  AuthChallenge? _challenge;
  MemberSession? _session;
  AuthFailureKind? _failure;

  AuthSubmission get submission => _submission;
  AuthChallenge? get challenge => _challenge;
  MemberSession? get session => _session;
  AuthFailureKind? get failure => _failure;
  bool get isSubmitting => _submission == AuthSubmission.submitting;

  Future<bool> startDemoSignIn({
    required String email,
    required String password,
  }) async {
    _beginSubmission();
    try {
      final result = await _startDemoSignIn(email: email, password: password);
      switch (result) {
        case SecondFactorRequired(:final challenge):
          _challenge = challenge;
        case Authenticated(:final session):
          _session = session;
      }
      _failure = null;
      return true;
    } on AuthFailure catch (failure) {
      _failure = failure.kind;
      return false;
    } finally {
      _endSubmission();
    }
  }

  Future<bool> verifySecondFactor(String code) async {
    final currentChallenge = _challenge;
    if (currentChallenge == null) {
      _failure = AuthFailureKind.expiredChallenge;
      notifyListeners();
      return false;
    }

    _beginSubmission();
    try {
      _session = await _verifySecondFactor(
        challenge: currentChallenge,
        code: code,
      );
      _failure = null;
      return true;
    } on AuthFailure catch (failure) {
      _failure = failure.kind;
      return false;
    } finally {
      _endSubmission();
    }
  }

  void clearFailure() {
    if (_failure == null) {
      return;
    }
    _failure = null;
    notifyListeners();
  }

  void reset() {
    _challenge = null;
    _session = null;
    _failure = null;
    _submission = AuthSubmission.idle;
    notifyListeners();
  }

  void _beginSubmission() {
    _submission = AuthSubmission.submitting;
    _failure = null;
    notifyListeners();
  }

  void _endSubmission() {
    _submission = AuthSubmission.idle;
    notifyListeners();
  }
}
