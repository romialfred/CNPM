import 'package:flutter/material.dart';

/// Flutter projection of the normative CNPM design tokens.
abstract final class CnpmColors {
  static const brandBlue50 = Color(0xFFF4F6FF);
  static const brandBlue = Color(0xFF273481);
  static const brandBlueDark = Color(0xFF14205F);
  static const brandRed = Color(0xFFE40C20);
  static const page = Color(0xFFF8F9FC);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceSubtle = Color(0xFFF2F4F7);
  static const textPrimary = Color(0xFF101828);
  static const textSecondary = Color(0xFF475467);
  static const textMuted = Color(0xFF667085);
  static const border = Color(0xFFD0D5DD);
  static const borderSubtle = Color(0xFFEAECF0);
  static const success = Color(0xFF039855);
  static const warning = Color(0xFFDC6803);
  static const error = Color(0xFFD92D20);
  static const errorSurface = Color(0xFFFEF3F2);
  static const info = Color(0xFF1570EF);
  static const infoSurface = Color(0xFFEFF8FF);
}

abstract final class CnpmSpacing {
  static const x1 = 4.0;
  static const x2 = 8.0;
  static const x3 = 12.0;
  static const x4 = 16.0;
  static const x5 = 20.0;
  static const x6 = 24.0;
  static const x8 = 32.0;
  static const x10 = 40.0;
  static const x12 = 48.0;
}

abstract final class CnpmRadii {
  static const control = 8.0;
  static const card = 12.0;
  static const panel = 16.0;
}

abstract final class CnpmSizes {
  static const minimumTouchTarget = 44.0;
  static const mobileControl = 48.0;
  static const mobileContentMax = 430.0;
  static const tabletContentMax = 768.0;
}

ThemeData buildCnpmTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: CnpmColors.brandBlue,
    brightness: Brightness.light,
    primary: CnpmColors.brandBlue,
    error: CnpmColors.error,
    surface: CnpmColors.surface,
  );
  final baseTheme = ThemeData(
    colorScheme: colorScheme,
    scaffoldBackgroundColor: CnpmColors.page,
    useMaterial3: true,
  );

  return baseTheme.copyWith(
    textTheme: baseTheme.textTheme.apply(
      bodyColor: CnpmColors.textPrimary,
      displayColor: CnpmColors.textPrimary,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: CnpmColors.surface,
      foregroundColor: CnpmColors.textPrimary,
      elevation: 0,
      scrolledUnderElevation: 0,
      surfaceTintColor: CnpmColors.surface,
    ),
    cardTheme: const CardThemeData(
      color: CnpmColors.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(CnpmRadii.card)),
        side: BorderSide(color: CnpmColors.borderSubtle),
      ),
    ),
    inputDecorationTheme: const InputDecorationTheme(
      filled: true,
      fillColor: CnpmColors.surface,
      contentPadding: EdgeInsets.symmetric(
        horizontal: CnpmSpacing.x4,
        vertical: CnpmSpacing.x4,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(CnpmRadii.control)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(CnpmRadii.control)),
        borderSide: BorderSide(color: CnpmColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(CnpmRadii.control)),
        borderSide: BorderSide(color: CnpmColors.brandBlue, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(CnpmRadii.control)),
        borderSide: BorderSide(color: CnpmColors.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(CnpmRadii.control)),
        borderSide: BorderSide(color: CnpmColors.error, width: 2),
      ),
      labelStyle: TextStyle(color: CnpmColors.textSecondary),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size.fromHeight(CnpmSizes.mobileControl),
        backgroundColor: CnpmColors.brandBlue,
        foregroundColor: CnpmColors.surface,
        disabledBackgroundColor: CnpmColors.surfaceSubtle,
        disabledForegroundColor: CnpmColors.textMuted,
        elevation: 0,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(
            Radius.circular(CnpmRadii.control),
          ),
        ),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(CnpmSizes.minimumTouchTarget),
        foregroundColor: CnpmColors.brandBlue,
        side: const BorderSide(color: CnpmColors.brandBlue),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(
            Radius.circular(CnpmRadii.control),
          ),
        ),
      ),
    ),
    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(
        minimumSize: const Size.square(CnpmSizes.minimumTouchTarget),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: CnpmColors.surface,
      indicatorColor: CnpmColors.brandBlue50,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        return TextStyle(
          color: states.contains(WidgetState.selected)
              ? CnpmColors.brandBlue
              : CnpmColors.textSecondary,
          fontSize: 12,
          fontWeight: states.contains(WidgetState.selected)
              ? FontWeight.w600
              : FontWeight.w400,
        );
      }),
    ),
    dividerTheme: const DividerThemeData(color: CnpmColors.borderSubtle),
  );
}
