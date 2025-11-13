import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary = Color(0xFF7F22FE);
  static const Color background = Color(0xFFF7F7FA);
  static const Color textPrimary = Color(0xFF0F172A);

  static final TextTheme textTheme = TextTheme(
    headlineLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
    bodySmall: TextStyle(fontSize: 14),
  );

  static final ThemeData lightTheme = ThemeData(
    primaryColor: primary,
    scaffoldBackgroundColor: background,
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.white,
      titleTextStyle: TextStyle(color: textPrimary, fontSize: 18, fontWeight: FontWeight.w600),
      iconTheme: IconThemeData(color: textPrimary),
      elevation: 0,
    ),
    textTheme: textTheme,
    fontFamily: 'PlusJakartaSans',
  );
}
