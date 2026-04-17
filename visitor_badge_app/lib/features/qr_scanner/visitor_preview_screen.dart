import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/api/visitor_api.dart';
import '../../core/models/visitor_model.dart';
import '../../core/services/settings_service.dart';
import '../../core/services/print_service.dart';
import '../../widgets/loading_overlay.dart';
import '../../widgets/badge_preview.dart';

class VisitorPreviewScreen extends StatefulWidget {
  final String onlineRegId;

  const VisitorPreviewScreen({super.key, required this.onlineRegId});

  @override
  State<VisitorPreviewScreen> createState() => _VisitorPreviewScreenState();
}

class _VisitorPreviewScreenState extends State<VisitorPreviewScreen> {
  final _visitorApi = VisitorApi();
  final _printService = PrintService();
  final _settingsService = SettingsService();

  VisitorModel? _visitor;
  bool _isLoading = true;
  bool _isPrinting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchVisitor();
  }

  Future<void> _fetchVisitor() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    await _settingsService.init();
    final eventId = _settingsService.eventId;
    if (eventId == null) {
      setState(() {
        _isLoading = false;
        _error = 'No event configured. Please go to Settings.';
      });
      return;
    }

    try {
      final visitor = await _visitorApi.searchByOnlineId(eventId, widget.onlineRegId);
      if (visitor == null) {
        setState(() => _error =
            'No visitor found for ID: ${widget.onlineRegId}\n\nThis registration may not have been synced yet.');
      } else {
        setState(() => _visitor = visitor);
      }
    } catch (e) {
      setState(() => _error = 'Error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _printBadge() async {
    if (_visitor == null) return;
    setState(() => _isPrinting = true);
    try {
      await _printService.printBadge(
        visitor: _visitor!,
        eventName: _settingsService.eventName,
        copies: _settingsService.badgeCopies,
      );
      final id = _visitor!.id;
      final eventId = _settingsService.eventId;
      if (id != null) {
        await _visitorApi.incrementPrintCount(eventId, id);
        // Refresh visitor to get updated print count
        final updated = await _visitorApi.getVisitor(eventId, id);
        setState(() => _visitor = updated);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Print failed: $e'),
              backgroundColor: AppTheme.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isPrinting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Visitor Details'),
        actions: [
          if (_visitor != null)
            IconButton(
              icon: const Icon(Icons.refresh_outlined),
              tooltip: 'Refresh',
              onPressed: _fetchVisitor,
            ),
        ],
      ),
      body: LoadingOverlay(
        isLoading: _isLoading || _isPrinting,
        message: _isPrinting ? 'Preparing badge…' : 'Loading visitor…',
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  color: AppTheme.error.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(18),
                ),
                child:
                    const Icon(Icons.search_off, color: AppTheme.error, size: 36),
              ),
              const SizedBox(height: 20),
              Text(
                'Not Found',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'ID: ${widget.onlineRegId}',
                  style: const TextStyle(
                      color: AppTheme.textSecondary,
                      fontFamily: 'monospace',
                      fontSize: 12),
                ),
              ),
              const SizedBox(height: 28),
              OutlinedButton.icon(
                icon: const Icon(Icons.arrow_back),
                label: const Text('Scan Again'),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
        ),
      );
    }

    if (_visitor == null && !_isLoading) {
      return const SizedBox.shrink();
    }

    if (_visitor == null) return const SizedBox.shrink();

    final v = _visitor!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Online Reg ID chip
          Center(
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.accent.withOpacity(0.12),
                borderRadius: BorderRadius.circular(20),
                border:
                    Border.all(color: AppTheme.accent.withOpacity(0.4)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.qr_code_2,
                      color: AppTheme.accent, size: 16),
                  const SizedBox(width: 6),
                  Text(
                    widget.onlineRegId,
                    style: const TextStyle(
                        color: AppTheme.accent,
                        fontSize: 13,
                        fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Visitor Card
          _buildVisitorCard(v),
          const SizedBox(height: 20),

          // Badge Preview
          BadgePreview(
              visitor: v, eventName: _settingsService.eventName),
          const SizedBox(height: 24),

          // Print Count
          if (v.printCount > 0)
            Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Previously printed: ${v.printCount} time${v.printCount > 1 ? 's' : ''}',
                  style: const TextStyle(
                      color: AppTheme.textSecondary, fontSize: 12),
                ),
              ),
            ),
          if (v.printCount > 0) const SizedBox(height: 16),

          // Print button
          ElevatedButton.icon(
            icon: _isPrinting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        color: Colors.white, strokeWidth: 2))
                : const Icon(Icons.print_outlined),
            label: Text(
              _isPrinting ? 'Printing…' : 'Print Badge',
              style: const TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w700),
            ),
            onPressed: (_isLoading || _isPrinting) ? null : _printBadge,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              backgroundColor: AppTheme.accent,
              foregroundColor: Colors.black,
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            icon: const Icon(Icons.qr_code_scanner_outlined, size: 18),
            label: const Text('Scan Another'),
            onPressed: () => Navigator.of(context).pop(),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildVisitorCard(VisitorModel v) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppTheme.primary, AppTheme.accent],
                  ),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Text(
                    v.displayName.isNotEmpty
                        ? v.displayName[0].toUpperCase()
                        : '?',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(v.displayName,
                        style: const TextStyle(
                            color: AppTheme.textPrimary,
                            fontWeight: FontWeight.w700,
                            fontSize: 16)),
                    if (v.organisation != null &&
                        v.organisation!.isNotEmpty)
                      Text(v.organisation!,
                          style: const TextStyle(
                              color: AppTheme.textSecondary,
                              fontSize: 13)),
                  ],
                ),
              ),
              if (v.isVerified)
                const Icon(Icons.verified,
                    color: AppTheme.accent, size: 20),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: AppTheme.border),
          const SizedBox(height: 12),
          _buildInfoRow(Icons.badge_outlined, 'Badge ID',
              v.badgeId ?? 'N/A'),
          _buildInfoRow(Icons.article_outlined, 'Form ID', v.formId),
          if (v.email != null && v.email!.isNotEmpty)
            _buildInfoRow(Icons.email_outlined, 'Email', v.email!),
          if (v.phone1 != null && v.phone1!.isNotEmpty)
            _buildInfoRow(Icons.phone_outlined, 'Phone', v.phone1!),
          if (v.nationality != null && v.nationality!.isNotEmpty)
            _buildInfoRow(
                Icons.flag_outlined, 'Nationality', v.nationality!),
          if (v.gender != null && v.gender!.isNotEmpty)
            _buildInfoRow(
                Icons.person_outline, 'Gender', v.gender!),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.textSecondary, size: 16),
          const SizedBox(width: 8),
          Text('$label: ',
              style: const TextStyle(
                  color: AppTheme.textSecondary, fontSize: 13)),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}
