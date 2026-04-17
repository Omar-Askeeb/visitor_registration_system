class EventModel {
  final int id;
  final String name;
  final String? location;
  final String? startDate;
  final String? endDate;
  final String badgeIdPrefix;
  final String formIdPrefix;
  final String onlineRegPrefix;
  final String selfRegPrefix;
  final double? pageWidth;
  final double? pageHeight;
  final double? bcWidthFactor;
  final int? bcHeightPx;
  final double? posY;
  final String? status;
  final int visitorsCount;
  final List<dynamic> workfieldOptions;
  final List<dynamic> howexpoOptions;

  EventModel({
    required this.id,
    required this.name,
    this.location,
    this.startDate,
    this.endDate,
    required this.badgeIdPrefix,
    required this.formIdPrefix,
    required this.onlineRegPrefix,
    required this.selfRegPrefix,
    this.pageWidth,
    this.pageHeight,
    this.bcWidthFactor,
    this.bcHeightPx,
    this.posY,
    this.status,
    this.visitorsCount = 0,
    this.workfieldOptions = const [],
    this.howexpoOptions = const [],
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json['id'],
      name: json['name'] ?? '',
      location: json['location'],
      startDate: json['start_date'],
      endDate: json['end_date'],
      badgeIdPrefix: json['badge_id_prefix'] ?? '',
      formIdPrefix: json['form_id_prefix'] ?? '',
      onlineRegPrefix: json['online_reg_prefix'] ?? '',
      selfRegPrefix: json['self_reg_prefix'] ?? '',
      pageWidth: double.tryParse(json['page_width']?.toString() ?? ''),
      pageHeight: double.tryParse(json['page_height']?.toString() ?? ''),
      bcWidthFactor: double.tryParse(json['bc_width_factor']?.toString() ?? ''),
      bcHeightPx: int.tryParse(json['bc_height_px']?.toString() ?? ''),
      posY: double.tryParse(json['pos_y']?.toString() ?? ''),
      status: json['status'],
      visitorsCount: json['visitors_count'] ?? 0,
      workfieldOptions: json['workfield_options'] ?? [],
      howexpoOptions: json['howexpo_options'] ?? [],
    );
  }

  String get displayStatus {
    switch (status) {
      case 'active':
        return 'Active';
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      default:
        return status ?? 'Unknown';
    }
  }
}
