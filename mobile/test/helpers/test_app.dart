import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:cnpm_mobile/app/app_config.dart';
import 'package:cnpm_mobile/app/cnpm_app.dart';

Future<void> pumpCnpmApp(
  WidgetTester tester, {
  AppConfig config = const AppConfig.demo(),
  Size size = const Size(390, 844),
  double textScaleFactor = 1,
}) async {
  tester.view
    ..physicalSize = size
    ..devicePixelRatio = 1;
  tester.platformDispatcher.textScaleFactorTestValue = textScaleFactor;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
    tester.platformDispatcher.clearTextScaleFactorTestValue();
  });

  await tester.pumpWidget(CnpmApp(config: config));
  await tester.pumpAndSettle();
}

Future<void> openTwoFactorScreen(WidgetTester tester) async {
  await tester.enterText(
    find.byKey(const Key('email-input')),
    'membre@exemple.invalid',
  );
  await tester.enterText(
    find.byKey(const Key('password-input')),
    'mot-de-passe-fictif',
  );
  await tester.ensureVisible(find.byKey(const Key('login-submit')));
  await tester.pumpAndSettle();
  await tester.tap(find.byKey(const Key('login-submit')));
  await tester.pumpAndSettle();
}

Future<void> completeDemoSignIn(WidgetTester tester) async {
  await openTwoFactorScreen(tester);
  await tester.enterText(find.byKey(const Key('otp-input')), '123456');
  await tester.ensureVisible(find.byKey(const Key('verify-submit')));
  await tester.pumpAndSettle();
  await tester.tap(find.byKey(const Key('verify-submit')));
  await tester.pumpAndSettle();
}
