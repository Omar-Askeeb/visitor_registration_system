import 'package:flutter/material.dart';
import '../app/app.dart';
import '../core/services/settings_service.dart';

final settingsService = SettingsService();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await settingsService.init();
  runApp(const BadgePrinterApp());
}
