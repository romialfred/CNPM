import 'package:flutter/material.dart';

import 'package:cnpm_mobile/design_system/cnpm_theme.dart';

class CnpmSyncStatus extends StatelessWidget {
  const CnpmSyncStatus.demo({super.key})
    : label = 'Données locales de démonstration',
      detail = 'Aucun envoi et aucune synchronisation serveur.',
      icon = Icons.cloud_off_outlined;

  final String label;
  final String detail;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      label: '$label. $detail',
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: CnpmColors.surfaceSubtle,
          borderRadius: BorderRadius.circular(CnpmRadii.control),
          border: Border.all(color: CnpmColors.borderSubtle),
        ),
        child: Padding(
          padding: const EdgeInsets.all(CnpmSpacing.x3),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: CnpmColors.textSecondary),
              const SizedBox(width: CnpmSpacing.x3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: CnpmSpacing.x1),
                    Text(
                      detail,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
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
    );
  }
}
