import 'package:mysql_client/mysql_client.dart';
import '../services/settings_service.dart';

class SqlDatabaseService {
  static MySQLConnection? _conn;
  static final SettingsService _settings = SettingsService();

  /// Create and return a new connection or the existing one
  static Future<MySQLConnection> get connection async {
    if (_conn != null && _conn!.connected) return _conn!;

    await _settings.init();
    
    if (!_settings.isDbConfigured) {
      throw Exception('Database is not configured. Please check Settings.');
    }

    try {
      _conn = await MySQLConnection.createConnection(
        host: _settings.dbHost,
        port: _settings.dbPort,
        userName: _settings.dbUser,
        password: _settings.dbPassword,
        databaseName: _settings.dbName,
        secure: false, // Explicitly disable SSL/TLS for local DB simplicity
      );

      await _conn!.connect();
      return _conn!;
    } catch (e) {
      print('DB Connection Error: $e');
      rethrow;
    }
  }

  /// Close the existing connection
  static Future<void> close() async {
    if (_conn != null) {
      await _conn!.close();
      _conn = null;
    }
  }

  /// Manually test a connection with specific settings
  static Future<void> testConnection({
    required String host,
    required int port,
    required String user,
    required String password,
    required String db,
  }) async {
    final conn = await MySQLConnection.createConnection(
      host: host,
      port: port,
      userName: user,
      password: password,
      databaseName: db,
      secure: false,
    );

    await conn.connect();
    final result = await conn.execute('SELECT 1');
    if (result.rows.isEmpty) throw Exception('Test query failed');
    await conn.close();
  }
}
