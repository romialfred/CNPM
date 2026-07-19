import 'package:cnpm_mobile/app/app_config.dart';
import 'package:cnpm_mobile/core/presentation/content_controller.dart';
import 'package:cnpm_mobile/features/auth/application/start_demo_sign_in.dart';
import 'package:cnpm_mobile/features/auth/application/verify_second_factor.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_gateway.dart';
import 'package:cnpm_mobile/features/auth/infrastructure/demo_auth_gateway.dart';
import 'package:cnpm_mobile/features/auth/infrastructure/unavailable_auth_gateway.dart';
import 'package:cnpm_mobile/features/auth/presentation/auth_flow_controller.dart';
import 'package:cnpm_mobile/features/contributions/application/load_member_contribution.dart';
import 'package:cnpm_mobile/features/contributions/application/load_member_contributions.dart';
import 'package:cnpm_mobile/features/contributions/domain/member_contribution.dart';
import 'package:cnpm_mobile/features/contributions/domain/member_contribution_gateway.dart';
import 'package:cnpm_mobile/features/contributions/infrastructure/demo_member_contribution_gateway.dart';
import 'package:cnpm_mobile/features/contributions/infrastructure/unavailable_member_contribution_gateway.dart';
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
import 'package:cnpm_mobile/features/requests/application/add_shared_request_message.dart';
import 'package:cnpm_mobile/features/requests/application/create_member_request.dart';
import 'package:cnpm_mobile/features/requests/application/load_member_request.dart';
import 'package:cnpm_mobile/features/requests/application/load_member_requests.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request_gateway.dart';
import 'package:cnpm_mobile/features/requests/infrastructure/demo_member_request_gateway.dart';
import 'package:cnpm_mobile/features/requests/infrastructure/unavailable_member_request_gateway.dart';
import 'package:cnpm_mobile/features/receipts/application/load_member_receipt.dart';
import 'package:cnpm_mobile/features/receipts/application/load_member_receipts.dart';
import 'package:cnpm_mobile/features/receipts/domain/member_receipt.dart';
import 'package:cnpm_mobile/features/receipts/domain/member_receipt_gateway.dart';
import 'package:cnpm_mobile/features/receipts/infrastructure/demo_member_receipt_gateway.dart';
import 'package:cnpm_mobile/features/receipts/infrastructure/unavailable_member_receipt_gateway.dart';

final class AppComposition {
  AppComposition._({
    required this.authController,
    required this.contributionController,
    required this.loadMemberContribution,
    required this.dashboardController,
    required this.paymentController,
    required this.receiptController,
    required this.loadMemberReceipt,
    required this.requestController,
    required this.loadMemberRequest,
    required this.createMemberRequest,
    required this.addSharedRequestMessage,
  });

  factory AppComposition.create(AppConfig config) {
    final AuthGateway authGateway = config.isDemo
        ? DemoAuthGateway()
        : const UnavailableAuthGateway();
    final MemberDashboardGateway dashboardGateway = config.isDemo
        ? const DemoMemberDashboardGateway()
        : const UnavailableMemberDashboardGateway();
    final MemberContributionGateway contributionGateway = config.isDemo
        ? const DemoMemberContributionGateway()
        : const UnavailableMemberContributionGateway();
    final MemberPaymentGateway paymentGateway = config.isDemo
        ? const DemoMemberPaymentGateway()
        : const UnavailableMemberPaymentGateway();
    final MemberRequestGateway requestGateway = config.isDemo
        ? DemoMemberRequestGateway()
        : const UnavailableMemberRequestGateway();
    final MemberReceiptGateway receiptGateway = config.isDemo
        ? const DemoMemberReceiptGateway()
        : const UnavailableMemberReceiptGateway();

    return AppComposition._(
      authController: AuthFlowController(
        startDemoSignIn: StartDemoSignIn(authGateway),
        verifySecondFactor: VerifySecondFactor(authGateway),
      ),
      contributionController: ContentController<List<MemberContribution>>(
        load: LoadMemberContributions(contributionGateway).call,
        isEmpty: (contributions) => contributions.isEmpty,
      ),
      loadMemberContribution: LoadMemberContribution(contributionGateway),
      dashboardController: ContentController<MemberDashboard>(
        load: LoadMemberDashboard(dashboardGateway).call,
        isEmpty: (dashboard) => false,
      ),
      paymentController: ContentController<List<MemberPayment>>(
        load: LoadMemberPayments(paymentGateway).call,
        isEmpty: (payments) => payments.isEmpty,
      ),
      receiptController: ContentController<MemberReceiptCollection>(
        load: LoadMemberReceipts(receiptGateway).call,
        isEmpty: (collection) => false,
      ),
      loadMemberReceipt: LoadMemberReceipt(receiptGateway),
      requestController: ContentController<List<MemberRequest>>(
        load: LoadMemberRequests(requestGateway).call,
        isEmpty: (requests) => requests.isEmpty,
      ),
      loadMemberRequest: LoadMemberRequest(requestGateway),
      createMemberRequest: CreateMemberRequest(requestGateway),
      addSharedRequestMessage: AddSharedRequestMessage(requestGateway),
    );
  }

  final AuthFlowController authController;
  final ContentController<List<MemberContribution>> contributionController;
  final LoadMemberContribution loadMemberContribution;
  final ContentController<MemberDashboard> dashboardController;
  final ContentController<List<MemberPayment>> paymentController;
  final ContentController<MemberReceiptCollection> receiptController;
  final LoadMemberReceipt loadMemberReceipt;
  final ContentController<List<MemberRequest>> requestController;
  final LoadMemberRequest loadMemberRequest;
  final CreateMemberRequest createMemberRequest;
  final AddSharedRequestMessage addSharedRequestMessage;

  void signOut() {
    dashboardController.reset();
    contributionController.reset();
    paymentController.reset();
    receiptController.reset();
    requestController.reset();
    authController.reset();
  }

  void dispose() {
    authController.dispose();
    contributionController.dispose();
    dashboardController.dispose();
    paymentController.dispose();
    receiptController.dispose();
    requestController.dispose();
  }
}
