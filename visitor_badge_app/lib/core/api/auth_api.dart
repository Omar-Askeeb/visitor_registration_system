import 'package:bcrypt/bcrypt.dart';
import '../services/sql_database_service.dart';

class AuthApi {
  /// SQL-based login via direct DB access
  Future<Map<String, dynamic>> login(String identifier, String password) async {
    final conn = await SqlDatabaseService.connection;
    
    // 1. Fetch user by email or phone
    final results = await conn.execute(
      'SELECT id, name, email, phone, password FROM v2_users WHERE email = :id OR phone = :id LIMIT 1',
      {"id": identifier},
    );

    if (results.rows.isEmpty) {
      throw Exception('User not found.');
    }

    final row = results.rows.first;
    final map = row.assoc();
    
    final int id = int.tryParse(map['id'] ?? '') ?? 0;
    final String name = map['name'] ?? 'User';
    final String hashedPass = map['password'] ?? '';

    // 2. Verify Bcrypt password (matching Laravel)
    final bool isValid = BCrypt.checkpw(password, hashedPass);

    if (!isValid) {
      throw Exception('Invalid credentials.');
    }

    // Return structure compatible with previous code
    return {
      'token': 'DB_Direct_Session',
      'user': {
        'id': id,
        'name': name,
      },
    };
  }
}
