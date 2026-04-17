import 'package:mysql_client/mysql_client.dart';

void main() async {
  final conn = await MySQLConnection.createConnection(
    host: '127.0.0.1',
    port: 3306,
    userName: 'remote',
    password: 'Pass4235',
    databaseName: 'digital_group_events',
  );
  try {
    await conn.connect();
    print('Connected to digital_group_events');
    
    await conn.execute('ALTER TABLE v2_visitors ADD COLUMN has_whatsapp BOOLEAN DEFAULT FALSE AFTER phone1');
    print('Column has_whatsapp added successfully.');
    
  } catch (e) {
    if (e.toString().contains('Duplicate column name')) {
      print('Column has_whatsapp already exists.');
    } else {
      print('Error: $e');
    }
  } finally {
    await conn.close();
  }
}
