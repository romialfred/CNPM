import 'package:flutter/material.dart';

import 'package:cnpm_mobile/design_system/cnpm_theme.dart';

class CnpmLoadingState extends StatelessWidget {
  const CnpmLoadingState({required this.label, super.key});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      liveRegion: true,
      label: label,
      child: const Center(
        child: Padding(
          padding: EdgeInsets.all(CnpmSpacing.x8),
          child: CircularProgressIndicator(),
        ),
      ),
    );
  }
}

class CnpmEmptyState extends StatelessWidget {
  const CnpmEmptyState({
    required this.title,
    required this.message,
    required this.icon,
    super.key,
  });

  final String title;
  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return _CnpmStateCard(icon: icon, title: title, message: message);
  }
}

class CnpmErrorState extends StatelessWidget {
  const CnpmErrorState({
    required this.onRetry,
    this.title = 'Contenu indisponible',
    this.message =
        'La source sécurisée n’est pas configurée. Réessayez lorsque la connexion au service CNPM est disponible.',
    super.key,
  });

  final VoidCallback onRetry;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return _CnpmStateCard(
      icon: Icons.cloud_off_outlined,
      title: title,
      message: message,
      action: OutlinedButton.icon(
        onPressed: onRetry,
        icon: const Icon(Icons.refresh),
        label: const Text('Réessayer'),
      ),
    );
  }
}

class _CnpmStateCard extends StatelessWidget {
  const _CnpmStateCard({
    required this.icon,
    required this.title,
    required this.message,
    this.action,
  });

  final IconData icon;
  final String title;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CnpmSpacing.x6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: CnpmColors.brandBlue, size: CnpmSpacing.x8),
            const SizedBox(height: CnpmSpacing.x3),
            Semantics(
              header: true,
              child: Text(
                title,
                textAlign: TextAlign.center,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            const SizedBox(height: CnpmSpacing.x2),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: CnpmColors.textSecondary,
                height: 1.4,
              ),
            ),
            if (action != null) ...[
              const SizedBox(height: CnpmSpacing.x4),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}
