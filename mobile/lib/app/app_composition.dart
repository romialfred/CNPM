import 'package:cnpm_mobile/app/app_config.dart';
import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/features/auth/application/start_demo_sign_in.dart';
import 'package:cnpm_mobile/features/auth/application/verify_second_factor.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_gateway.dart';
import 'package:cnpm_mobile/features/auth/infrastructure/demo_auth_gateway.dart';
import 'package:cnpm_mobile/features/auth/infrastructure/unavailable_auth_gateway.dart';
import 'package:cnpm_mobile/features/auth/presentation/auth_flow_controller.dart';
import 'package:cnpm_mobile/features/home/application/load_member_dashboard.dart';
import 'package:cnpm_mobile/features/home/domain/member_dashboard.dart';
import 'package:cnpm_mobile/features/home/domain/member_dashboard_gateway.dart';
import 'package:cnpm_mobile/features/home/infrastructure/demo_member_dashboard_gateway.dart';
import 'package:cnpm_mobile/features/home/infrastructure/unavailable_member_dashboard_gateway.dart';
import 'package:cnpm_mobile/features/payments/application/load_member_payments.dart';
import 'package:cnpm_mobile/features/payments/domain/member_payment.dart';
import 'package:cnpm_mobile/features/payments/domain/member_payment_gateway.dart';
import 'package:cnpm_mobile/features/payments/infrastructure/demo_member_payment_gateway.dart';
import 'package:cnpm_mobile/features/payments/infrastructure/unavailable_member_payment_gateway.dart';
import 'package:cnpm_mobile/features/requests/application/load_member_requests.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request_gateway.dart';
import 'package:cnpm_mobile/features/requests/infrastructure/demo_member_request_gateway.dart';
import 'package:cnpm_mobile/features/requests/infrastructure/unavailable_member_request_gateway.dart';

final class AppComposition {
  AppComposition._({
    required this.authController,
    required this.dashboardController,
    required this.paymentController,
    required this.requestController,
  });

  factory AppComposition.create(AppConfig config) {
    final AuthGateway authGateway = config.isDemo
        ? DemoAuthGateway()
        : const UnavailableAuthGateway();
    final MemberDashboardGateway dashboardGateway = config.isDemo
        ? const DemoMemberDashboardGateway()
        : const UnavailableMemberDashboardGateway();
    final MemberPaymentGateway paymentGateway = config.isDemo
        ? const DemoMemberPaymentGateway()
        : const UnavailableMemberPaymentGateway();
    final MemberRequestGateway requestGateway = config.isDemo
        ? const DemoMemberRequestGateway()
        : const UnavailableMemberRequestGateway();

    return AppComposition._(
      authController: AuthFlowController(
        startDemoSignIn: StartDemoSignIn(authGateway),
        verifySecondFactor: VerifySecondFactor(authGateway),
      ),
      dashboardController: ContentController<MemberDashboard>(
        load: LoadMemberDashboard(dashboardGateway).call,
        isEmpty: (dashboard) => false,
      ),
      paymentController: ContentController<List<MemberPayment>>(
        load: LoadMemberPayments(paymentGateway).call,
        isEmpty: (payments) => payments.isEmpty,
      ),
      requestController: ContentController<List<MemberRequest>>(
        load: LoadMemberRequests(requestGateway).call,
        isEmpty: (requests) => requests.isEmpty,
      ),
    );
  }

  final AuthFlowController authController;
  final ContentController<MemberDashboard> dashboardController;
  final ContentController<List<MemberPayment>> paymentController;
  final ContentController<List<MemberRequest>> requestController;

  void signOut() {
    dashboardController.reset();
    paymentController.reset();
    requestController.reset();
    authController.reset();
  }

  void dispose() {
    authController.dispose();
    dashboardController.dispose();
    paymentController.dispose();
    requestController.dispose();
  }
}
