import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/app/app_config.dart';
import 'package:cnpm_mobile/features/auth/presentation/auth_flow_controller.dart';
import 'package:cnpm_mobile/features/auth/presentation/login_screen.dart';
import 'package:cnpm_mobile/features/auth/presentation/verify_two_factor_screen.dart';
import 'package:cnpm_mobile/features/home/presentation/member_home_screen.dart';

GoRouter buildAppRouter({
  required AppConfig config,
  required AuthFlowController authController,
}) {
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
      if (path == '/home' && !hasSession) {
        return '/login';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        name: 'mobile-login',
        builder: (context, state) => LoginScreen(
          controller: authController,
          isDemo: config.isDemo,
        ),
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
          controller: authController,
        ),
      ),
    ],
  );
}
