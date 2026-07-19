import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import '../helpers/test_app.dart';

void main() {
  const viewports = <String, Size>{
    '360': Size(360, 800),
    '390': Size(390, 844),
    '430': Size(430, 932),
  };

  for (final viewport in viewports.entries) {
    testWidgets('MOB-003 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile('goldens/mob_003_home_${viewport.key}.png'),
      );
    });

    testWidgets('MOB-008 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);
      await tester.tap(find.text('Finances'));
      await tester.pumpAndSettle();

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile('goldens/mob_008_payments_${viewport.key}.png'),
      );
    });

    testWidgets('MOB-004 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);
      final homeContext = tester.element(
        find.byKey(const Key('member-home-list')),
      );
      GoRouter.of(homeContext).go('/contributions');
      await tester.pumpAndSettle();

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile('goldens/mob_004_contributions_${viewport.key}.png'),
      );
    });

    testWidgets('MOB-005 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);
      final homeContext = tester.element(
        find.byKey(const Key('member-home-list')),
      );
      GoRouter.of(homeContext).go('/contributions/demo-contribution-2026-001');
      await tester.pumpAndSettle();

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile(
          'goldens/mob_005_contribution_detail_${viewport.key}.png',
        ),
      );
    });

    testWidgets('MOB-009 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);
      final homeContext = tester.element(
        find.byKey(const Key('member-home-list')),
      );
      GoRouter.of(homeContext).go('/receipts');
      await tester.pumpAndSettle();

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile('goldens/mob_009_receipts_${viewport.key}.png'),
      );
    });

    testWidgets('MOB-010 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);
      final homeContext = tester.element(
        find.byKey(const Key('member-home-list')),
      );
      GoRouter.of(homeContext).go('/receipts/demo-receipt-preview-2026-001');
      await tester.pumpAndSettle();

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile(
          'goldens/mob_010_receipt_preview_${viewport.key}.png',
        ),
      );
    });

    testWidgets('MOB-011 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);
      await tester.tap(find.text('Requêtes'));
      await tester.pumpAndSettle();

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile('goldens/mob_011_requests_${viewport.key}.png'),
      );
    });

    testWidgets('MOB-012 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);
      final homeContext = tester.element(
        find.byKey(const Key('member-home-list')),
      );
      GoRouter.of(homeContext).go('/requests/new');
      await tester.pumpAndSettle();

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile('goldens/mob_012_request_new_${viewport.key}.png'),
      );
    });

    testWidgets('MOB-013 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);
      final homeContext = tester.element(
        find.byKey(const Key('member-home-list')),
      );
      GoRouter.of(homeContext).go('/requests/demo-request-0003');
      await tester.pumpAndSettle();

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile(
          'goldens/mob_013_request_conversation_${viewport.key}.png',
        ),
      );
    });

    testWidgets('MOB-014 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);
      final homeContext = tester.element(
        find.byKey(const Key('member-home-list')),
      );
      GoRouter.of(homeContext).go('/documents');
      await tester.pumpAndSettle();

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile('goldens/mob_014_documents_${viewport.key}.png'),
      );
    });

    testWidgets('MOB-015 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);
      final homeContext = tester.element(
        find.byKey(const Key('member-home-list')),
      );
      GoRouter.of(homeContext).go('/notifications');
      await tester.pumpAndSettle();

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile('goldens/mob_015_notifications_${viewport.key}.png'),
      );
    });

    testWidgets('MOB-016 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);
      final homeContext = tester.element(
        find.byKey(const Key('member-home-list')),
      );
      GoRouter.of(homeContext).go('/profile');
      await tester.pumpAndSettle();

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile('goldens/mob_016_profile_${viewport.key}.png'),
      );
    });

    testWidgets('MOB-017 ${viewport.key}', (tester) async {
      await pumpCnpmApp(tester, size: viewport.value);
      await completeDemoSignIn(tester);
      final homeContext = tester.element(
        find.byKey(const Key('member-home-list')),
      );
      GoRouter.of(homeContext).go('/security');
      await tester.pumpAndSettle();

      await expectLater(
        find.byKey(const Key('app-surface')),
        matchesGoldenFile('goldens/mob_017_security_${viewport.key}.png'),
      );
    });
  }
}
