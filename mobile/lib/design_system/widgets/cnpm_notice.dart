import 'package:flutter/material.dart';

import 'package:cnpm_mobile/design_system/cnpm_theme.dart';

enum CnpmNoticeTone { information, error }

class CnpmNotice extends StatelessWidget {
  const CnpmNotice({
    required this.message,
    this.tone = CnpmNoticeTone.information,
    super.key,
  });

  final String message;
  final CnpmNoticeTone tone;

  @override
  Widget build(BuildContext context) {
    final isError = tone == CnpmNoticeTone.error;
    final foreground = isError ? CnpmColors.error : CnpmColors.info;
    final background = isError
        ? CnpmColors.errorSurface
        : CnpmColors.infoSurface;

    return Semantics(
      container: true,
      liveRegion: isError,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(CnpmRadii.control),
          border: Border.all(color: foreground),
        ),
        child: Padding(
          padding: const EdgeInsets.all(CnpmSpacing.x3),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                isError ? Icons.error_outline : Icons.info_outline,
                color: foreground,
                size: 20,
              ),
              const SizedBox(width: CnpmSpacing.x2),
              Expanded(
                child: Text(
                  message,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: CnpmColors.textPrimary,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
