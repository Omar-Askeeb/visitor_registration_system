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
    print('Connected');
    
    final dbs = await conn.execute('SHOW DATABASES');
    for (final db in dbs.rows) {
      print('DB: ${db.assoc()}');
    }
  } catch (e) {
    print('Error: $e');
  } finally {
    await conn.close();
  }
}
