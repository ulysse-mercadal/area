import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'src/routes.dart';
import 'src/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: ".env").timeout(const Duration(seconds: 5));
  } catch (e) {
    debugPrint('Warning: dotenv load failed or timed out: $e');
  }
  final isLoggedIn = await _checkAuthStatus();
  runApp(AreaFromJsonApp(isLoggedIn: isLoggedIn));
}

Future<bool> _checkAuthStatus() async {
  try {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    return token != null && token.isNotEmpty;
  } catch (e) {
    debugPrint('Error checking auth status: $e');
    return false;
  }
}

class AreaFromJsonApp extends StatelessWidget {
  final bool isLoggedIn;

  const AreaFromJsonApp({
    Key? key,
    required this.isLoggedIn,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AREA (from JSON)',
      theme: AppTheme.lightTheme,
      initialRoute: isLoggedIn ? Routes.credentials : Routes.home,
      routes: Routes.map,
      debugShowCheckedModeBanner: false,
    );
  }
}
