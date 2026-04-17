import 'package:mysql_client/mysql_client.dart';

void main() async {
  final conn = await MySQLConnection.createConnection(
    host: '127.0.0.1',
    port: 3306,
    userName: 'root',
    password: '',
    databaseName: 'v2_events', // Correct database name based on previous commands
  );
  await conn.connect();
  print('Connected to v2_events');
  
  final result = await conn.execute('DESCRIBE v2_visitors');
  for (final row in result.rows) {
    print(row.assoc());
  }
  await conn.close();
}
