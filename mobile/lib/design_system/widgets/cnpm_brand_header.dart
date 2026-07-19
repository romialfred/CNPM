import 'package:flutter/material.dart';

import 'package:cnpm_mobile/design_system/cnpm_theme.dart';

class CnpmBrandHeader extends StatelessWidget {
  const CnpmBrandHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      header: true,
      label: 'Conseil National du Patronat du Mali',
      child: ExcludeSemantics(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: CnpmSpacing.x1,
              height: CnpmSpacing.x10,
              decoration: const BoxDecoration(
                color: CnpmColors.brandRed,
                borderRadius: BorderRadius.all(
                  Radius.circular(CnpmRadii.control),
                ),
              ),
            ),
            const SizedBox(width: CnpmSpacing.x3),
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'CNPM',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: CnpmColors.brandBlue,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.4,
                    ),
                  ),
                  Text(
                    'Conseil National du Patronat du Mali',
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
    );
  }
}
