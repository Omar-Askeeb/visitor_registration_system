import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/visitor_model.dart';

import '../services/sql_database_service.dart';
import '../services/settings_service.dart';

class VisitorApi {
  final SettingsService _settings = SettingsService();

  Future<VisitorModel> store(int eventId, VisitorModel visitor) async {
    final conn = await SqlDatabaseService.connection;
    await _settings.init();
    
    final creatorId = _settings.operatorUserId > 0 ? _settings.operatorUserId : null;

    try {
      final result = await conn.execute(
        '''INSERT INTO v2_visitors 
           (event_id, formID, badgeID, print_count, visitorName, midleName, surName, organisation, email, phone1, has_whatsapp, phone2, gender, nationality, resident, workfield, howexpo, creator_id, created_at, updated_at) 
           VALUES (:eid, :fid, :bid, 0, :vn, :mn, :sn, :org, :email, :p1, :hwa, :p2, :gen, :nat, :res, :wf, :he, :cid, NOW(), NOW())''',
        {
          "eid": eventId,
          "fid": visitor.formId,
          "bid": visitor.badgeId,
          "vn": visitor.visitorName,
          "mn": visitor.midleName,
          "sn": visitor.surName,
          "org": visitor.organisation,
          "email": visitor.email,
          "p1": visitor.phone1,
          "hwa": visitor.hasWhatsapp ? 1 : 0,
          "p2": visitor.phone2,
          "gen": visitor.gender,
          "nat": visitor.nationality,
          "res": visitor.resident,
          "wf": jsonEncode(visitor.workfield),
          "he": jsonEncode(visitor.howexpo),
          "cid": creatorId,
        },
      );

      final visitorId = result.lastInsertID.toInt();
      if (visitorId == 0) throw Exception('Insert succeeded but returned ID 0');
      
      return getVisitor(eventId, visitorId);
    } catch (e) {
      debugPrint('DB Insert Error: $e');
      debugPrint('Parameters: eventId=$eventId, formId=${visitor.formId}, creatorId=$creatorId');
      rethrow;
    }
  }

  Future<String> getNextBadgeId(int eventId, String prefix) async {
    final conn = await SqlDatabaseService.connection;
    final results = await conn.execute(
      'SELECT badgeID FROM v2_visitors WHERE badgeID LIKE :prefix ORDER BY id DESC LIMIT 1',
      {"prefix": "$prefix%"},
    );

    if (results.rows.isEmpty) {
      return '${prefix}0001';
    }

    final lastId = results.rows.first.assoc()['badgeID']?.toString() ?? '';
    final numericPart = lastId.replaceFirst(prefix, '');
    final number = int.tryParse(numericPart) ?? 0;
    return prefix + (number + 1).toString().padLeft(4, '0');
  }

  Future<VisitorModel> getVisitor(int eventId, int visitorId) async {
    final conn = await SqlDatabaseService.connection;
    final results = await conn.execute(
      'SELECT * FROM v2_visitors WHERE id = :vid', 
      {"vid": visitorId}
    );
    
    if (results.rows.isEmpty) throw Exception('Visitor not found');
    final map = results.rows.first.assoc();
    
    return VisitorModel.fromJson(map);
  }

  Future<VisitorModel?> searchByOnlineId(int eventId, String onlineRegId) async {
    final conn = await SqlDatabaseService.connection;
    final results = await conn.execute(
      'SELECT * FROM v2_visitors WHERE event_id = :eid AND onlineRegID = :oid LIMIT 1',
      {"eid": eventId, "oid": onlineRegId},
    );
    
    if (results.rows.isEmpty) return null;
    return VisitorModel.fromJson(results.rows.first.assoc());
  }

  Future<void> incrementPrintCount(int eventId, int visitorId) async {
    final conn = await SqlDatabaseService.connection;
    
    await conn.execute(
      'UPDATE v2_visitors SET print_count = print_count + 1 WHERE id = :vid',
      {"vid": visitorId},
    );
  }

  Future<String> getNextFormId(int eventId, String prefix) async {
    final conn = await SqlDatabaseService.connection;
    final results = await conn.execute(
      'SELECT formID FROM v2_visitors WHERE formID LIKE :prefix ORDER BY id DESC LIMIT 1',
      {"prefix": "$prefix%"},
    );

    if (results.rows.isEmpty) {
      return '${prefix}0001';
    }

    final lastId = results.rows.first.assoc()['formID'] ?? '';
    final numericPart = lastId.replaceFirst(prefix, '');
    final number = int.tryParse(numericPart) ?? 0;
    return prefix + (number + 1).toString().padLeft(4, '0');
  }
}
