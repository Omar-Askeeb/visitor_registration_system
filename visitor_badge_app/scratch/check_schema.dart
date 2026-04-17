import 'package:mysql_client/mysql_client.dart';

void main() async {
  final conn = await MySQLConnection.createConnection(
    host: '127.0.0.1',
    port: 3306,
    userName: 'remote',
    password: 'Pass4235',
  );
  try {
    await conn.connect();
    
    final databases = ['digital_group_events', 'libya_build'];
    for (final db in databases) {
      print('Checking database: $db');
      try {
        await conn.execute('USE $db');
        final tables = await conn.execute("SHOW TABLES LIKE 'v2_visitors'");
        if (tables.rows.isNotEmpty) {
          print('Found v2_visitors in $db');
          final columns = await conn.execute('DESCRIBE v2_visitors');
          for (final col in columns.rows) {
            print(col.assoc());
          }
          return;
        }
      } catch (e) {
        print('Error checking $db: $e');
      }
    }
  } catch (e) {
    print('Connection error: $e');
  } finally {
    await conn.close();
  }
}
