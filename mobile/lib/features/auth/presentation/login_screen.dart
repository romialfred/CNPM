import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_notice.dart';
import 'package:cnpm_mobile/features/auth/presentation/auth_failure_message.dart';
import 'package:cnpm_mobile/features/auth/presentation/auth_flow_controller.dart';
import 'package:cnpm_mobile/features/auth/presentation/widgets/mobile_auth_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({
    required this.controller,
    required this.isDemo,
    super.key,
  });

  final AuthFlowController controller;
  final bool isDemo;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MobileAuthShell(
      screenId: 'MOB-001',
      title: 'Connexion à votre compte',
      subtitle: 'Accédez à votre espace membre CNPM.',
      child: AnimatedBuilder(
        animation: widget.controller,
        builder: (context, child) {
          final errorMessage = authFailureMessage(widget.controller.failure);
          final isEnabled = widget.isDemo && !widget.controller.isSubmitting;

          return Form(
            key: _formKey,
            child: AutofillGroup(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (widget.isDemo)
                    const CnpmNotice(
                      message:
                          'Mode démonstration : utilisez une adresse se terminant par .invalid et un mot de passe fictif d’au moins 8 caractères. Rien n’est envoyé ni conservé.',
                    )
                  else
                    const CnpmNotice(
                      tone: CnpmNoticeTone.error,
                      message:
                          'Connexion indisponible : le client OIDC/PKCE Keycloak n’est pas encore configuré.',
                    ),
                  const SizedBox(height: CnpmSpacing.x5),
                  if (errorMessage != null) ...[
                    CnpmNotice(
                      tone: CnpmNoticeTone.error,
                      message: errorMessage,
                    ),
                    const SizedBox(height: CnpmSpacing.x4),
                  ],
                  TextFormField(
                    key: const Key('email-input'),
                    controller: _emailController,
                    enabled: isEnabled,
                    autofillHints: const [
                      AutofillHints.username,
                      AutofillHints.email,
                    ],
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    autocorrect: false,
                    decoration: const InputDecoration(
                      labelText: 'Adresse e-mail de démonstration',
                      hintText: 'membre@exemple.invalid',
                    ),
                    validator: _validateEmail,
                    onChanged: (_) => widget.controller.clearFailure(),
                  ),
                  const SizedBox(height: CnpmSpacing.x4),
                  TextFormField(
                    key: const Key('password-input'),
                    controller: _passwordController,
                    enabled: isEnabled,
                    autofillHints: const [AutofillHints.password],
                    obscureText: _obscurePassword,
                    enableSuggestions: false,
                    autocorrect: false,
                    textInputAction: TextInputAction.done,
                    decoration: InputDecoration(
                      labelText: 'Mot de passe fictif',
                      suffixIcon: IconButton(
                        tooltip: _obscurePassword
                            ? 'Afficher le mot de passe'
                            : 'Masquer le mot de passe',
                        onPressed: isEnabled
                            ? () {
                                setState(() {
                                  _obscurePassword = !_obscurePassword;
                                });
                              }
                            : null,
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                        ),
                      ),
                    ),
                    validator: _validatePassword,
                    onChanged: (_) => widget.controller.clearFailure(),
                    onFieldSubmitted: isEnabled ? (_) => _submit() : null,
                  ),
                  const SizedBox(height: CnpmSpacing.x6),
                  ElevatedButton(
                    key: const Key('login-submit'),
                    onPressed: isEnabled ? _submit : null,
                    child: widget.controller.isSubmitting
                        ? const _LoadingLabel(label: 'Connexion en cours')
                        : const Text('Se connecter'),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  String? _validateEmail(String? value) {
    final email = value?.trim() ?? '';
    if (email.isEmpty) {
      return 'Saisissez une adresse e-mail.';
    }
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      return 'Saisissez une adresse e-mail valide.';
    }
    if (widget.isDemo && !email.toLowerCase().endsWith('.invalid')) {
      return 'Utilisez une adresse fictive se terminant par .invalid.';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Saisissez un mot de passe fictif.';
    }
    if (value.length < 8) {
      return 'Utilisez au moins 8 caractères pour la démonstration.';
    }
    return null;
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    final succeeded = await widget.controller.startDemoSignIn(
      email: _emailController.text,
      password: _passwordController.text,
    );
    if (succeeded && mounted) {
      context.go('/verify');
    }
  }
}

class _LoadingLabel extends StatelessWidget {
  const _LoadingLabel({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      child: const SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          color: CnpmColors.surface,
        ),
      ),
    );
  }
}
