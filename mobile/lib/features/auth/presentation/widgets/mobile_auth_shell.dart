import 'package:flutter/material.dart';

import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_brand_header.dart';

class MobileAuthShell extends StatelessWidget {
  const MobileAuthShell({
    required this.screenId,
    required this.title,
    required this.subtitle,
    required this.child,
    super.key,
  });

  final String screenId;
  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(CnpmSpacing.x4),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(
                    maxWidth: CnpmSizes.mobileContentMax,
                  ),
                  child: Padding(
                    padding: EdgeInsets.only(
                      top: constraints.maxHeight > 760
                          ? CnpmSpacing.x8
                          : CnpmSpacing.x2,
                      bottom: CnpmSpacing.x6,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const CnpmBrandHeader(),
                        const SizedBox(height: CnpmSpacing.x8),
                        Semantics(
                          header: true,
                          child: Text(
                            title,
                            style: Theme.of(context).textTheme.headlineSmall
                                ?.copyWith(
                                  color: CnpmColors.brandBlueDark,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                        ),
                        const SizedBox(height: CnpmSpacing.x2),
                        Text(
                          subtitle,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: CnpmColors.textSecondary,
                                height: 1.45,
                              ),
                        ),
                        const SizedBox(height: CnpmSpacing.x6),
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(CnpmSpacing.x5),
                            child: child,
                          ),
                        ),
                        const SizedBox(height: CnpmSpacing.x4),
                        Text(
                          screenId,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(color: CnpmColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
