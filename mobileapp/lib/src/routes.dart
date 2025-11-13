import 'package:flutter/material.dart';
import 'screens/landing_page.dart';
import 'screens/register.dart';
import 'screens/login.dart';
import 'screens/credentials.dart';
import 'screens/account.dart';
import 'screens/workflow.dart';

class Routes {
  static const String home = '/';
  static const String credentials = '/credentials';
  static final Map<String, WidgetBuilder> map = {
    '/': (_) => const LandingPagePage(),
    '/register': (_) => const RegisterPage(),
    '/login': (_) => const LoginPage(),
    '/credentials': (_) => const CredentialsPage(),
    '/account': (_) => const AccountSettingsPage(),
    '/workflow': (_) => const WorkflowPage(),
  };
}
