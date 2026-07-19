import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/app/app_config.dart';
import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/features/auth/presentation/auth_flow_controller.dart';
import 'package:cnpm_mobile/features/auth/presentation/login_screen.dart';
import 'package:cnpm_mobile/features/auth/presentation/verify_two_factor_screen.dart';
import 'package:cnpm_mobile/features/contributions/application/load_member_contribution.dart';
import 'package:cnpm_mobile/features/contributions/domain/member_contribution.dart';
import 'package:cnpm_mobile/features/contributions/presentation/contribution_detail_screen.dart';
import 'package:cnpm_mobile/features/contributions/presentation/contribution_list_screen.dart';
import 'package:cnpm_mobile/features/home/domain/member_dashboard.dart';
import 'package:cnpm_mobile/features/home/presentation/member_home_screen.dart';
import 'package:cnpm_mobile/features/payments/domain/member_payment.dart';
import 'package:cnpm_mobile/features/payments/presentation/payment_history_screen.dart';
import 'package:cnpm_mobile/features/requests/application/add_shared_request_message.dart';
import 'package:cnpm_mobile/features/requests/application/create_member_request.dart';
import 'package:cnpm_mobile/features/requests/application/load_member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request.dart';
import 'package:cnpm_mobile/features/requests/presentation/member_request_conversation_screen.dart';
import 'package:cnpm_mobile/features/requests/presentation/member_request_list_screen.dart';
import 'package:cnpm_mobile/features/requests/presentation/new_member_request_screen.dart';
import 'package:cnpm_mobile/features/receipts/application/load_member_receipt.dart';
import 'package:cnpm_mobile/features/receipts/domain/member_receipt.dart';
import 'package:cnpm_mobile/features/receipts/presentation/receipt_detail_screen.dart';
import 'package:cnpm_mobile/features/receipts/presentation/receipt_list_screen.dart';

GoRouter buildAppRouter({
  required AppConfig config,
  required AuthFlowController authController,
  required ContentController<List<MemberContribution>> contributionController,
  required LoadMemberContribution loadMemberContribution,
  required ContentController<MemberDashboard> dashboardController,
  required ContentController<List<MemberPayment>> paymentController,
  required ContentController<MemberReceiptCollection> receiptController,
  required LoadMemberReceipt loadMemberReceipt,
  required ContentController<List<MemberRequest>> requestController,
  required LoadMemberRequest loadMemberRequest,
  required CreateMemberRequest createMemberRequest,
  required AddSharedRequestMessage addSharedRequestMessage,
  required VoidCallback onSignOut,
}) {
  const authenticatedPaths = {
    '/home',
    '/payments',
    '/requests',
    '/contributions',
    '/receipts',
  };

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
      final isContributionPath = path.startsWith('/contributions/');
      final isReceiptPath = path.startsWith('/receipts/');
      final isRequestPath = path.startsWith('/requests/');
      if ((authenticatedPaths.contains(path) ||
              isContributionPath ||
              isReceiptPath ||
              isRequestPath) &&
          !hasSession) {
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
        path: '/contributions',
        name: 'mobile-contributions',
        builder: (context, state) => ContributionListScreen(
          controller: contributionController,
          isDemo: config.isDemo,
          onSignOut: onSignOut,
        ),
      ),
      GoRoute(
        path: '/contributions/:id',
        name: 'mobile-contribution-detail',
        builder: (context, state) => ContributionDetailScreen(
          key: ValueKey(state.pathParameters['id']),
          contributionId: state.pathParameters['id']!,
          loadContribution: loadMemberContribution,
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
        path: '/receipts',
        name: 'mobile-receipts',
        builder: (context, state) => ReceiptListScreen(
          controller: receiptController,
          isDemo: config.isDemo,
          onSignOut: onSignOut,
        ),
      ),
      GoRoute(
        path: '/receipts/:id',
        name: 'mobile-receipt-detail',
        builder: (context, state) => ReceiptDetailScreen(
          key: ValueKey(state.pathParameters['id']),
          receiptId: state.pathParameters['id']!,
          loadReceipt: loadMemberReceipt,
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
      GoRoute(
        path: '/requests/new',
        name: 'mobile-request-new',
        builder: (context, state) => NewMemberRequestScreen(
          createMemberRequest: createMemberRequest,
          onCreated: requestController.reload,
          isDemo: config.isDemo,
          onSignOut: onSignOut,
        ),
      ),
      GoRoute(
        path: '/requests/:id',
        name: 'mobile-request-conversation',
        builder: (context, state) => MemberRequestConversationScreen(
          key: ValueKey(state.pathParameters['id']),
          requestId: state.pathParameters['id']!,
          loadMemberRequest: loadMemberRequest,
          addSharedRequestMessage: addSharedRequestMessage,
          isDemo: config.isDemo,
          onSignOut: onSignOut,
        ),
      ),
    ],
  );
}
