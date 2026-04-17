import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary = Color(0xFF6C63FF);
  static const Color primaryDark = Color(0xFF4A43CC);
  static const Color accent = Color(0xFF00D4AA);
  static const Color background = Color(0xFF0F0E1A);
  static const Color surface = Color(0xFF1C1B2E);
  static const Color surfaceLight = Color(0xFF252442);
  static const Color cardBg = Color(0xFF1E1D32);
  static const Color error = Color(0xFFFF5C7C);
  static const Color textPrimary = Color(0xFFEEEEFF);
  static const Color textSecondary = Color(0xFF9896B8);
  static const Color border = Color(0xFF2E2D4A);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      colorScheme: const ColorScheme.dark(
        primary: primary,
        secondary: accent,
        surface: surface,
        error: error,
        onPrimary: Colors.white,
        onSecondary: Colors.black,
        onSurface: textPrimary,
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
            color: textPrimary, fontWeight: FontWeight.w700, fontSize: 32),
        displayMedium: TextStyle(
            color: textPrimary, fontWeight: FontWeight.w600, fontSize: 26),
        headlineMedium: TextStyle(
            color: textPrimary, fontWeight: FontWeight.w600, fontSize: 22),
        titleLarge: TextStyle(
            color: textPrimary, fontWeight: FontWeight.w600, fontSize: 18),
        titleMedium: TextStyle(
            color: textPrimary, fontWeight: FontWeight.w500, fontSize: 16),
        bodyLarge: TextStyle(color: textPrimary, fontSize: 16),
        bodyMedium: TextStyle(color: textSecondary, fontSize: 14),
        labelLarge: TextStyle(
            color: textPrimary, fontWeight: FontWeight.w600, fontSize: 14),
      ),
      cardTheme: CardThemeData(
        color: cardBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: border, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: error),
        ),
        hintStyle: const TextStyle(color: textSecondary, fontSize: 14),
        labelStyle: const TextStyle(color: textSecondary, fontSize: 14),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
              fontWeight: FontWeight.w600, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary,
          side: const BorderSide(color: primary),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
              fontWeight: FontWeight.w600, fontSize: 15),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: surface,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: textPrimary,
          fontWeight: FontWeight.w700,
          fontSize: 18,
        ),
        iconTheme: IconThemeData(color: textPrimary),
      ),
      dividerColor: border,
    );
  }
}
