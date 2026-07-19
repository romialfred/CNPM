import 'package:cnpm_mobile/app/app_config.dart';
import 'package:cnpm_mobile/features/auth/application/start_demo_sign_in.dart';
import 'package:cnpm_mobile/features/auth/application/verify_second_factor.dart';
import 'package:cnpm_mobile/features/auth/domain/auth_gateway.dart';
import 'package:cnpm_mobile/features/auth/infrastructure/demo_auth_gateway.dart';
import 'package:cnpm_mobile/features/auth/infrastructure/unavailable_auth_gateway.dart';
import 'package:cnpm_mobile/features/auth/presentation/auth_flow_controller.dart';

final class AppComposition {
  AppComposition._({required this.authController});

  factory AppComposition.create(AppConfig config) {
    final AuthGateway authGateway = config.isDemo
        ? DemoAuthGateway()
        : const UnavailableAuthGateway();

    return AppComposition._(
      authController: AuthFlowController(
        startDemoSignIn: StartDemoSignIn(authGateway),
        verifySecondFactor: VerifySecondFactor(authGateway),
      ),
    );
  }

  final AuthFlowController authController;

  void dispose() {
    authController.dispose();
  }
}
