import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:cnpm_mobile/design_system/cnpm_theme.dart';

class CnpmOtpInput extends StatelessWidget {
  const CnpmOtpInput({
    required this.controller,
    required this.enabled,
    required this.validator,
    required this.onChanged,
    required this.onSubmitted,
    super.key,
  });

  final TextEditingController controller;
  final bool enabled;
  final FormFieldValidator<String> validator;
  final ValueChanged<String> onChanged;
  final ValueChanged<String> onSubmitted;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      key: const Key('otp-input'),
      controller: controller,
      enabled: enabled,
      validator: validator,
      onChanged: onChanged,
      onFieldSubmitted: onSubmitted,
      autofillHints: const [AutofillHints.oneTimeCode],
      keyboardType: TextInputType.number,
      textInputAction: TextInputAction.done,
      textAlign: TextAlign.center,
      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
        color: CnpmColors.textPrimary,
        fontWeight: FontWeight.w600,
        letterSpacing: CnpmSpacing.x4,
      ),
      decoration: const InputDecoration(
        labelText: 'Code de vérification à six chiffres',
        hintText: '• • • • • •',
        counterText: '',
      ),
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        LengthLimitingTextInputFormatter(6),
      ],
      maxLength: 6,
    );
  }
}
