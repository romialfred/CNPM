import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/app/mobile_app_shell.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_notice.dart';
import 'package:cnpm_mobile/features/auth/presentation/auth_flow_controller.dart';

class MemberHomeScreen extends StatelessWidget {
  const MemberHomeScreen({required this.controller, super.key});

  final AuthFlowController controller;

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Espace membre',
      onSignOut: () {
        controller.reset();
        context.go('/login');
      },
      body: ListView(
        padding: const EdgeInsets.all(CnpmSpacing.x4),
        children: [
          const CnpmNotice(
            message:
                'Mode démonstration : aucune session, aucun jeton et aucune donnée membre réelle ne sont utilisés.',
          ),
          const SizedBox(height: CnpmSpacing.x6),
          Semantics(
            header: true,
            child: Text(
              'Connexion terminée',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: CnpmColors.brandBlueDark,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: CnpmSpacing.x2),
          Text(
            'Le shell membre responsive est prêt. Les données, paiements, reçus et requêtes ne sont pas simulés dans ce lot.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: CnpmColors.textSecondary,
              height: 1.5,
            ),
          ),
          const SizedBox(height: CnpmSpacing.x6),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(CnpmSpacing.x5),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.verified_user_outlined,
                    color: CnpmColors.success,
                  ),
                  const SizedBox(width: CnpmSpacing.x3),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          controller.session?.displayName ??
                              'Membre de démonstration',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: CnpmSpacing.x1),
                        Text(
                          'Session locale éphémère, sans stockage sensible.',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: CnpmColors.textSecondary,
                              ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
