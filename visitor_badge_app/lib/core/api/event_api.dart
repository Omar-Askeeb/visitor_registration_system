import 'dart:convert';
import '../models/event_model.dart';
import '../services/sql_database_service.dart';

class EventApi {
  Future<List<EventModel>> listEvents() async {
    final conn = await SqlDatabaseService.connection;
    final results = await conn.execute('SELECT * FROM v2_events ORDER BY id DESC');
    
    return results.rows.map((row) {
      final map = row.assoc();
      return EventModel(
        id: int.tryParse(map['id']?.toString() ?? '') ?? 0,
        name: map['name']?.toString() ?? '',
        location: map['location']?.toString(),
        startDate: map['start_date']?.toString(),
        endDate: map['end_date']?.toString(),
        badgeIdPrefix: map['badge_id_prefix']?.toString() ?? '',
        formIdPrefix: map['form_id_prefix']?.toString() ?? '',
        onlineRegPrefix: map['online_reg_prefix']?.toString() ?? '',
        selfRegPrefix: map['self_reg_prefix']?.toString() ?? '',
        pageWidth: double.tryParse(map['page_width']?.toString() ?? ''),
        pageHeight: double.tryParse(map['page_height']?.toString() ?? ''),
        bcWidthFactor: double.tryParse(map['bc_width_factor']?.toString() ?? ''),
        bcHeightPx: int.tryParse(map['bc_height_px']?.toString() ?? ''),
        posY: double.tryParse(map['pos_y']?.toString() ?? ''),
        status: map['status']?.toString() ?? '',
        workfieldOptions: _decodeJson(map['workfield_options'] ?? map['workfield']),
        howexpoOptions: _decodeJson(map['howexpo_options'] ?? map['howexpo']),
      );
    }).toList();
  }

  List<dynamic> _decodeJson(dynamic value) {
    if (value == null || value.toString().isEmpty || value == 'NULL') return [];
    try {
      return jsonDecode(value.toString());
    } catch (_) {
      return [];
    }
  }

  Future<EventModel> getEvent(int id) async {
    final conn = await SqlDatabaseService.connection;
    final results = await conn.execute(
      'SELECT * FROM v2_events WHERE id = :id',
      {"id": id},
    );
    
    if (results.rows.isEmpty) throw Exception('Event not found');
    final map = results.rows.first.assoc();
    
    return EventModel(
      id: int.tryParse(map['id'] ?? '') ?? 0,
      name: map['name'] ?? '',
      location: map['location'],
      badgeIdPrefix: map['badge_id_prefix'] ?? '',
      formIdPrefix: map['form_id_prefix'] ?? '',
      onlineRegPrefix: map['online_reg_prefix'] ?? '',
      selfRegPrefix: map['self_reg_prefix'] ?? '',
      pageWidth: double.tryParse(map['page_width']?.toString() ?? ''),
      pageHeight: double.tryParse(map['page_height']?.toString() ?? ''),
      bcWidthFactor: double.tryParse(map['bc_width_factor']?.toString() ?? ''),
      bcHeightPx: int.tryParse(map['bc_height_px']?.toString() ?? ''),
      posY: double.tryParse(map['pos_y']?.toString() ?? ''),
      status: map['status'] ?? '',
      workfieldOptions: _decodeJson(map['workfield_options'] ?? map['workfield']),
      howexpoOptions: _decodeJson(map['howexpo_options'] ?? map['howexpo']),
    );
  }
}
