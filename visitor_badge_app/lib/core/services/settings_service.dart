import 'package:shared_preferences/shared_preferences.dart';

enum AppMode { selfServe, onlineRegister }

class SettingsService {
  static const String _keyDbHost = 'db_host';
  static const String _keyDbPort = 'db_port';
  static const String _keyDbUser = 'db_user';
  static const String _keyDbPassword = 'db_password';
  static const String _keyDbName = 'db_name';

  static const String _keyAppMode = 'app_mode';
  static const String _keyEventId = 'event_id';
  static const String _keyEventName = 'event_name';
  static const String _keyBadgePrefix = 'badge_prefix';
  static const String _keyFormPrefix = 'form_prefix';
  static const String _keySettingsPin = 'settings_pin';
  static const String _keyBadgeCopies = 'badge_copies';
  
  static const String _keyOperatorIdentifier = 'operator_identifier';
  static const String _keyOperatorPassword = 'operator_password';
  static const String _keyOperatorUserId = 'operator_user_id';
  
  static const String _keySelfRegPrefix = 'self_reg_prefix';
  static const String _keyPageWidth = 'page_width';
  static const String _keyPageHeight = 'page_height';
  static const String _keyBcWidthFactor = 'bc_width_factor';
  static const String _keyBcHeightPx = 'bc_height_px';
  static const String _keyPosY = 'pos_y';

  late SharedPreferences _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // Database Connection
  String get dbHost => _prefs.getString(_keyDbHost) ?? '';
  Future<void> setDbHost(String value) => _prefs.setString(_keyDbHost, value);

  int get dbPort => _prefs.getInt(_keyDbPort) ?? 3306;
  Future<void> setDbPort(int value) => _prefs.setInt(_keyDbPort, value);

  String get dbUser => _prefs.getString(_keyDbUser) ?? '';
  Future<void> setDbUser(String value) => _prefs.setString(_keyDbUser, value);

  String get dbPassword => _prefs.getString(_keyDbPassword) ?? '';
  Future<void> setDbPassword(String value) => _prefs.setString(_keyDbPassword, value);

  String get dbName => _prefs.getString(_keyDbName) ?? '';
  Future<void> setDbName(String value) => _prefs.setString(_keyDbName, value);

  // App Configuration
  AppMode get appMode =>
      AppMode.values[_prefs.getInt(_keyAppMode) ?? AppMode.selfServe.index];
  Future<void> setAppMode(AppMode value) => _prefs.setInt(_keyAppMode, value.index);

  int get eventId => _prefs.getInt(_keyEventId) ?? 0;
  Future<void> setEventId(int value) => _prefs.setInt(_keyEventId, value);

  String get eventName => _prefs.getString(_keyEventName) ?? '';
  Future<void> setEventName(String value) => _prefs.setString(_keyEventName, value);

  String get badgePrefix => _prefs.getString(_keyBadgePrefix) ?? '';
  Future<void> setBadgePrefix(String value) => _prefs.setString(_keyBadgePrefix, value);

  String get formPrefix => _prefs.getString(_keyFormPrefix) ?? '';
  Future<void> setFormPrefix(String value) => _prefs.setString(_keyFormPrefix, value);

  String get settingsPin => _prefs.getString(_keySettingsPin) ?? '1234';
  Future<void> setSettingsPin(String value) => _prefs.setString(_keySettingsPin, value);

  int get badgeCopies => _prefs.getInt(_keyBadgeCopies) ?? 1;
  Future<void> setBadgeCopies(int value) => _prefs.setInt(_keyBadgeCopies, value);

  // Operator
  String get operatorIdentifier => _prefs.getString(_keyOperatorIdentifier) ?? '';
  Future<void> setOperatorIdentifier(String value) => _prefs.setString(_keyOperatorIdentifier, value);

  String get operatorPassword => _prefs.getString(_keyOperatorPassword) ?? '';
  Future<void> setOperatorPassword(String value) => _prefs.setString(_keyOperatorPassword, value);

  int get operatorUserId => _prefs.getInt(_keyOperatorUserId) ?? 0;
  Future<void> setOperatorUserId(int value) => _prefs.setInt(_keyOperatorUserId, value);

  String get selfRegPrefix => _prefs.getString(_keySelfRegPrefix) ?? '';
  Future<void> setSelfRegPrefix(String value) => _prefs.setString(_keySelfRegPrefix, value);

  double get pageWidth => _prefs.getDouble(_keyPageWidth) ?? 21.0;
  Future<void> setPageWidth(double value) => _prefs.setDouble(_keyPageWidth, value);

  double get pageHeight => _prefs.getDouble(_keyPageHeight) ?? 27.0;
  Future<void> setPageHeight(double value) => _prefs.setDouble(_keyPageHeight, value);

  double get bcWidthFactor => _prefs.getDouble(_keyBcWidthFactor) ?? 1.8;
  Future<void> setBcWidthFactor(double value) => _prefs.setDouble(_keyBcWidthFactor, value);

  int get bcHeightPx => _prefs.getInt(_keyBcHeightPx) ?? 50;
  Future<void> setBcHeightPx(int value) => _prefs.setInt(_keyBcHeightPx, value);

  double get posY => _prefs.getDouble(_keyPosY) ?? 6.5;
  Future<void> setPosY(double value) => _prefs.setDouble(_keyPosY, value);

  bool get isDbConfigured => 
      dbHost.isNotEmpty && 
      dbUser.isNotEmpty && 
      dbPassword.isNotEmpty && 
      dbName.isNotEmpty;

  bool get isConfigured => isDbConfigured && eventId > 0;
}
