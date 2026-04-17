import 'package:flutter/material.dart';
import '../app/theme.dart';
import '../core/services/settings_service.dart';
import '../features/settings/settings_screen.dart';
import '../features/settings/settings_pin_screen.dart';
import '../features/manual_register/manual_register_screen.dart';
import '../features/qr_scanner/qr_scanner_screen.dart';

class BadgePrinterApp extends StatelessWidget {
  const BadgePrinterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Badge Printer',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const SplashScreen(),
      routes: {
        '/settings': (context) => const SettingsScreen(),
        '/settings_pin': (context) => const SettingsPinScreen(),
        '/manual_register': (context) => const ManualRegisterScreen(),
        '/qr_scanner': (context) => const QrScannerScreen(),
      },
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  final SettingsService _settings = SettingsService();

  @override
  void initState() {
    super.initState();
    _navigate();
  }

  Future<void> _navigate() async {
    await _settings.init();
    
    if (!mounted) return;

    // Check if configuration exists
    if (_settings.isConfigured) {
      // Go directly to the selected mode screen
      if (_settings.appMode == AppMode.selfServe) {
        Navigator.of(context).pushReplacementNamed('/manual_register');
      } else {
        Navigator.of(context).pushReplacementNamed('/qr_scanner');
      }
    } else {
      // If not configured, go to Settings directly
      Navigator.of(context).pushReplacementNamed('/settings');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Image.asset(
                  'assets/images/logo.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Badge Printer',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
            ),
          ],
        ),
      ),
    );
  }
}
