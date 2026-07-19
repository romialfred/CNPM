import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_notice.dart';
import 'package:cnpm_mobile/features/auth/infrastructure/demo_auth_gateway.dart';
import 'package:cnpm_mobile/features/auth/presentation/auth_failure_message.dart';
import 'package:cnpm_mobile/features/auth/presentation/auth_flow_controller.dart';
import 'package:cnpm_mobile/features/auth/presentation/widgets/cnpm_otp_input.dart';
import 'package:cnpm_mobile/features/auth/presentation/widgets/mobile_auth_shell.dart';

class VerifyTwoFactorScreen extends StatefulWidget {
  const VerifyTwoFactorScreen({
    required this.controller,
    required this.isDemo,
    super.key,
  });

  final AuthFlowController controller;
  final bool isDemo;

  @override
  State<VerifyTwoFactorScreen> createState() => _VerifyTwoFactorScreenState();
}

class _VerifyTwoFactorScreenState extends State<VerifyTwoFactorScreen> {
  final _formKey = GlobalKey<FormState>();
  final _otpController = TextEditingController();

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MobileAuthShell(
      screenId: 'MOB-002',
      title: 'Vérification en deux étapes',
      subtitle:
          'Saisissez le code à six chiffres fourni par le facteur configuré.',
      child: AnimatedBuilder(
        animation: widget.controller,
        builder: (context, child) {
          final errorMessage = authFailureMessage(widget.controller.failure);
          final isEnabled = widget.isDemo && !widget.controller.isSubmitting;

          return Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (widget.isDemo)
                  const CnpmNotice(
                    message:
                        'Facteur fictif : aucun SMS ni e-mail n’est envoyé. Code public de démonstration : ${DemoAuthGateway.publicDemoCode}.',
                  )
                else
                  const CnpmNotice(
                    tone: CnpmNoticeTone.error,
                    message:
                        'Vérification indisponible : le client OIDC/PKCE Keycloak n’est pas encore configuré.',
                  ),
                const SizedBox(height: CnpmSpacing.x5),
                if (errorMessage != null) ...[
                  CnpmNotice(tone: CnpmNoticeTone.error, message: errorMessage),
                  const SizedBox(height: CnpmSpacing.x4),
                ],
                CnpmOtpInput(
                  controller: _otpController,
                  enabled: isEnabled,
                  validator: _validateCode,
                  onChanged: (_) => widget.controller.clearFailure(),
                  onSubmitted: isEnabled ? (_) => _submit() : (_) {},
                ),
                const SizedBox(height: CnpmSpacing.x6),
                ElevatedButton(
                  key: const Key('verify-submit'),
                  onPressed: isEnabled ? _submit : null,
                  child: widget.controller.isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: CnpmColors.surface,
                            semanticsLabel: 'Vérification en cours',
                          ),
                        )
                      : const Text('Vérifier le code'),
                ),
                const SizedBox(height: CnpmSpacing.x3),
                TextButton.icon(
                  key: const Key('back-to-login'),
                  onPressed: widget.controller.isSubmitting
                      ? null
                      : () {
                          widget.controller.reset();
                          context.go('/login');
                        },
                  icon: const Icon(Icons.arrow_back, size: 18),
                  label: const Text('Retour à la connexion'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  String? _validateCode(String? value) {
    if (value == null || value.length != 6) {
      return 'Saisissez les six chiffres du code.';
    }
    return null;
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    final succeeded = await widget.controller.verifySecondFactor(
      _otpController.text,
    );
    if (succeeded && mounted) {
      context.go('/home');
    }
  }
}
