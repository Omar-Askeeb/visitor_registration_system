import 'dart:convert';

class VisitorModel {
  final int? id;
  final int? eventId;
  final String formId;
  final String? badgeId;
  final String? onlineRegId;
  final String? visitorName;
  final String? midleName;
  final String? surName;
  final String? organisation;
  final String? email;
  final String? phone1;
  final String? phone2;
  final String? gender;
  final String? nationality;
  final String? resident;
  final List<dynamic> workfield;
  final List<dynamic> howexpo;
  final int printCount;
  final bool isVerified;
  final bool hasWhatsapp;

  VisitorModel({
    this.id,
    this.eventId,
    required this.formId,
    this.badgeId,
    this.onlineRegId,
    this.visitorName,
    this.midleName,
    this.surName,
    this.organisation,
    this.email,
    this.phone1,
    this.phone2,
    this.gender,
    this.nationality,
    this.resident,
    this.workfield = const [],
    this.howexpo = const [],
    this.printCount = 0,
    this.isVerified = false,
    this.hasWhatsapp = false,
  });

  factory VisitorModel.fromJson(Map<String, dynamic> json) {
    return VisitorModel(
      id: int.tryParse(json['id']?.toString() ?? ''),
      eventId: int.tryParse(json['event_id']?.toString() ?? ''),
      formId: json['formID'] ?? '',
      badgeId: json['badgeID'],
      onlineRegId: json['onlineRegID'],
      visitorName: json['visitorName'],
      midleName: json['midleName'],
      surName: json['surName'],
      organisation: json['organisation'],
      email: json['email'],
      phone1: json['phone1'],
      phone2: json['phone2'],
      gender: json['gender'],
      nationality: json['nationality'],
      resident: json['resident'],
      workfield: _parseList(json['workfield']),
      howexpo: _parseList(json['howexpo']),
      printCount: int.tryParse(json['print_count']?.toString() ?? '') ?? 0,
      isVerified: json['is_verified']?.toString() == '1' || json['is_verified'] == true,
      hasWhatsapp: json['has_whatsapp']?.toString() == '1' || json['has_whatsapp'] == true,
    );
  }

  static List<dynamic> _parseList(dynamic value) {
    if (value == null || value == 'NULL') return [];
    if (value is List) return value;
    if (value is String && value.isNotEmpty) {
      try {
        return jsonDecode(value);
      } catch (_) {
        return [];
      }
    }
    return [];
  }

  VisitorModel copyWith({
    int? id,
    int? eventId,
    String? formId,
    String? badgeId,
    String? onlineRegId,
    String? visitorName,
    String? midleName,
    String? surName,
    String? organisation,
    String? email,
    String? phone1,
    String? phone2,
    String? gender,
    String? nationality,
    String? resident,
    List<dynamic>? workfield,
    List<dynamic>? howexpo,
    int? printCount,
    bool? isVerified,
    bool? hasWhatsapp,
  }) {
    return VisitorModel(
      id: id ?? this.id,
      eventId: eventId ?? this.eventId,
      formId: formId ?? this.formId,
      badgeId: badgeId ?? this.badgeId,
      onlineRegId: onlineRegId ?? this.onlineRegId,
      visitorName: visitorName ?? this.visitorName,
      midleName: midleName ?? this.midleName,
      surName: surName ?? this.surName,
      organisation: organisation ?? this.organisation,
      email: email ?? this.email,
      phone1: phone1 ?? this.phone1,
      phone2: phone2 ?? this.phone2,
      gender: gender ?? this.gender,
      nationality: nationality ?? this.nationality,
      resident: resident ?? this.resident,
      workfield: workfield ?? this.workfield,
      howexpo: howexpo ?? this.howexpo,
      printCount: printCount ?? this.printCount,
      isVerified: isVerified ?? this.isVerified,
      hasWhatsapp: hasWhatsapp ?? this.hasWhatsapp,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'formID': formId,
      'badgeID': badgeId,
      'onlineRegID': onlineRegId,
      'visitorName': visitorName,
      'midleName': midleName,
      'surName': surName,
      'organisation': organisation,
      'email': email,
      'phone1': phone1,
      'phone2': phone2,
      'gender': gender,
      'nationality': nationality,
      'resident': resident,
      'workfield': workfield,
      'howexpo': howexpo,
      'print_count': printCount,
      'has_whatsapp': hasWhatsapp ? 1 : 0,
    };
  }

  String get fullName {
    final parts = [visitorName, midleName, surName]
        .where((p) => p != null && p.trim().isNotEmpty)
        .toList();
    return parts.join(' ');
  }

  String get displayName => fullName.isNotEmpty ? fullName : 'Unknown Visitor';
}
