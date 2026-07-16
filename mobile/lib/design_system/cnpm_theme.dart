// CNPM UI/UX Handoff v1.0 - generated baseline
import 'package:flutter/material.dart';

abstract final class CnpmColors {
  static const brandBlue = Color(0xFF273481);
  static const brandBlueDark = Color(0xFF14205F);
  static const brandRed = Color(0xFFE40C20);
  static const page = Color(0xFFF8F9FC);
  static const surface = Color(0xFFFFFFFF);
  static const textPrimary = Color(0xFF101828);
  static const textSecondary = Color(0xFF475467);
  static const border = Color(0xFFD0D5DD);
  static const success = Color(0xFF039855);
  static const warning = Color(0xFFDC6803);
  static const error = Color(0xFFD92D20);
  static const info = Color(0xFF1570EF);
}

abstract final class CnpmSpacing {
  static const x1 = 4.0; static const x2 = 8.0; static const x3 = 12.0;
  static const x4 = 16.0; static const x5 = 20.0; static const x6 = 24.0;
  static const x8 = 32.0; static const x10 = 40.0; static const x12 = 48.0;
}

ThemeData buildCnpmTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: CnpmColors.brandBlue,
    brightness: Brightness.light,
    primary: CnpmColors.brandBlue,
    error: CnpmColors.error,
    surface: CnpmColors.surface,
  );
  return ThemeData(
    colorScheme: scheme,
    scaffoldBackgroundColor: CnpmColors.page,
    useMaterial3: true,
    fontFamily: 'Inter', // Add through the approved project font process; font files are not supplied in this pack.
    inputDecorationTheme: const InputDecorationTheme(
      filled: true, fillColor: CnpmColors.surface,
      border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
      contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    ),
    cardTheme: const CardThemeData(
      color: CnpmColors.surface, elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(12)),
        side: BorderSide(color: Color(0xFFEAECF0)),
      ),
    ),
  );
}
