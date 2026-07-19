import 'package:flutter/material.dart';

import 'package:cnpm_mobile/design_system/cnpm_theme.dart';

enum CnpmStatusTone { neutral, info, success, warning, error }

class CnpmStatusBadge extends StatelessWidget {
  const CnpmStatusBadge({required this.label, required this.tone, super.key});

  final String label;
  final CnpmStatusTone tone;

  @override
  Widget build(BuildContext context) {
    final (foreground, background) = switch (tone) {
      CnpmStatusTone.neutral => (
        CnpmColors.textSecondary,
        CnpmColors.surfaceSubtle,
      ),
      CnpmStatusTone.info => (CnpmColors.info, CnpmColors.infoSurface),
      CnpmStatusTone.success => (CnpmColors.success, CnpmColors.successSurface),
      CnpmStatusTone.warning => (CnpmColors.warning, CnpmColors.warningSurface),
      CnpmStatusTone.error => (CnpmColors.error, CnpmColors.errorSurface),
    };

    return Semantics(
      label: 'Statut : $label',
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(CnpmRadii.panel),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: CnpmSpacing.x3,
            vertical: CnpmSpacing.x2,
          ),
          child: Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: foreground,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }
}
