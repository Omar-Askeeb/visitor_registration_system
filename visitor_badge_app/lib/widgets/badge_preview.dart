import 'package:flutter/material.dart';
import '../app/theme.dart';
import '../core/models/visitor_model.dart';

/// A visual badge layout shown in-app before printing.
class BadgePreview extends StatelessWidget {
  final VisitorModel visitor;
  final String eventName;

  const BadgePreview({
    super.key,
    required this.visitor,
    required this.eventName,
  });

  @override
  Widget build(BuildContext context) {
    final badgeId = visitor.badgeId ?? visitor.formId;

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A1A3E), Color(0xFF0D0D26)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.primary.withOpacity(0.5), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withOpacity(0.18),
            blurRadius: 20,
            offset: const Offset(0, 6),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Event header
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.primary, AppTheme.primaryDark],
              ),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: Image.asset('assets/images/logo.png', fit: BoxFit.contain),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  eventName.isNotEmpty ? eventName : 'فعالية معرض',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),

          // Visitor info
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              children: [
                // Avatar circle
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.primary, AppTheme.accent],
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withOpacity(0.4),
                        blurRadius: 12,
                      )
                    ],
                  ),
                  child: Center(
                    child: Text(
                      visitor.displayName.isNotEmpty
                          ? visitor.displayName[0].toUpperCase()
                          : '?',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  visitor.displayName,
                  style: const TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (visitor.organisation != null &&
                    visitor.organisation!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    visitor.organisation!,
                    style: const TextStyle(
                        color: AppTheme.textSecondary, fontSize: 12),
                    textAlign: TextAlign.center,
                  ),
                ],
                const SizedBox(height: 16),

                // Barcode placeholder stripe
                Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Visual barcode bars
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: _buildBarcodeBars(),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        badgeId,
                        style: const TextStyle(
                          color: Colors.black87,
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildBarcodeBars() {
    // Generate a pseudo-barcode look from the badgeId characters
    final badgeId = (visitor.badgeId ?? visitor.formId);
    final values = badgeId.codeUnits.take(20).toList();
    final bars = <Widget>[];
    for (int i = 0; i < 32; i++) {
      final v = values[i % values.length];
      final thick = (v + i) % 3 == 0;
      bars.add(Container(
        width: thick ? 3 : 1.5,
        height: thick ? 28 : 22,
        margin: const EdgeInsets.symmetric(horizontal: 0.5),
        color: Colors.black87,
      ));
    }
    return bars;
  }
}
