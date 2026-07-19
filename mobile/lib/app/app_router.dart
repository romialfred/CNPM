import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/app/app_config.dart';
import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/features/auth/presentation/auth_flow_controller.dart';
import 'package:cnpm_mobile/features/auth/presentation/login_screen.dart';
import 'package:cnpm_mobile/features/auth/presentation/verify_two_factor_screen.dart';
import 'package:cnpm_mobile/features/home/domain/member_dashboard.dart';
import 'package:cnpm_mobile/features/home/presentation/member_home_screen.dart';
import 'package:cnpm_mobile/features/payments/domain/member_payment.dart';
import 'package:cnpm_mobile/features/payments/presentation/payment_history_screen.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request.dart';
import 'package:cnpm_mobile/features/requests/presentation/member_request_list_screen.dart';

GoRouter buildAppRouter({
  required AppConfig config,
  required AuthFlowController authController,
  required ContentController<MemberDashboard> dashboardController,
  required ContentController<List<MemberPayment>> paymentController,
  required ContentController<List<MemberRequest>> requestController,
  required VoidCallback onSignOut,
}) {
  const authenticatedPaths = {'/home', '/payments', '/requests'};

  return GoRouter(
    initialLocation: '/login',
    refreshListenable: authController,
    redirect: (context, state) {
      final path = state.uri.path;
      final hasChallenge = authController.challenge != null;
      final hasSession = authController.session != null;

      if (hasSession && (path == '/login' || path == '/verify')) {
        return '/home';
      }
      if (path == '/verify' && !hasChallenge) {
        return '/login';
      }
      if (authenticatedPaths.contains(path) && !hasSession) {
        return '/login';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        name: 'mobile-login',
        builder: (context, state) =>
            LoginScreen(controller: authController, isDemo: config.isDemo),
      ),
      GoRoute(
        path: '/verify',
        name: 'mobile-verify',
        builder: (context, state) => VerifyTwoFactorScreen(
          controller: authController,
          isDemo: config.isDemo,
        ),
      ),
      GoRoute(
        path: '/home',
        name: 'mobile-home',
        builder: (context, state) => MemberHomeScreen(
          controller: dashboardController,
          displayName:
              authController.session?.displayName ?? 'Membre indisponible',
          isDemo: config.isDemo,
          onSignOut: onSignOut,
        ),
      ),
      GoRoute(
        path: '/payments',
        name: 'mobile-payments',
        builder: (context, state) => PaymentHistoryScreen(
          controller: paymentController,
          isDemo: config.isDemo,
          onSignOut: onSignOut,
        ),
      ),
      GoRoute(
        path: '/requests',
        name: 'mobile-requests',
        builder: (context, state) => MemberRequestListScreen(
          controller: requestController,
          isDemo: config.isDemo,
          onSignOut: onSignOut,
        ),
      ),
    ],
  );
}
