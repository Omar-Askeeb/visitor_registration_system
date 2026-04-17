import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../app/theme.dart';
import 'visitor_preview_screen.dart';

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen>
    with SingleTickerProviderStateMixin {
  final MobileScannerController _controller = MobileScannerController();
  bool _scanned = false;
  bool _torch = false;
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);
    _pulseAnim = Tween(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _controller.dispose();
    super.dispose();
  }

  /// Extract last path segment from a URL
  /// e.g. https://eventxcrm.com/api/attendance/LZ26-VIS-APP-508571 → LZ26-VIS-APP-508571
  String? _extractOnlineRegId(String raw) {
    final uri = Uri.tryParse(raw);
    if (uri != null && uri.pathSegments.isNotEmpty) {
      return uri.pathSegments.last;
    }
    // If not a URL, use raw value directly
    if (raw.isNotEmpty) return raw.trim();
    return null;
  }

  void _onDetect(BarcodeCapture capture) {
    if (_scanned) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode == null || barcode.rawValue == null) return;

    final raw = barcode.rawValue!;
    final onlineRegId = _extractOnlineRegId(raw);
    if (onlineRegId == null) return;

    setState(() => _scanned = true);
    _controller.stop();

    Navigator.of(context)
        .push(
          MaterialPageRoute(
            builder: (_) => VisitorPreviewScreen(onlineRegId: onlineRegId),
          ),
        )
        .then((_) {
          setState(() => _scanned = false);
          _controller.start();
        });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Scan Online Registration'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              Navigator.of(context).pushNamed('/settings_pin');
            },
          ),
          IconButton(
            icon: Icon(
              _torch ? Icons.flash_on : Icons.flash_off,
              color: _torch ? Colors.yellow : Colors.white60,
            ),
            onPressed: () {
              _controller.toggleTorch();
              setState(() => _torch = !_torch);
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          // Camera
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),

          // Overlay
          _buildOverlay(),
        ],
      ),
    );
  }

  Widget _buildOverlay() {
    return LayoutBuilder(builder: (context, constraints) {
      final size = constraints.maxWidth * 0.65;
      return Stack(
        children: [
          // Dark vignette around scan area
          ColorFiltered(
            colorFilter: ColorFilter.mode(
              Colors.black.withOpacity(0.55),
              BlendMode.srcOut,
            ),
            child: Stack(
              children: [
                Container(
                  decoration: const BoxDecoration(
                    color: Colors.black,
                    backgroundBlendMode: BlendMode.dstOut,
                  ),
                ),
                Align(
                  alignment: Alignment.center,
                  child: Container(
                    width: size,
                    height: size,
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Animated scan frame
          Align(
            alignment: Alignment.center,
            child: ScaleTransition(
              scale: _pulseAnim,
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppTheme.accent,
                    width: 3,
                  ),
                ),
                child: Stack(
                  children: [
                    _corner(top: 0, left: 0, topleft: true),
                    _corner(top: 0, right: 0, topright: true),
                    _corner(bottom: 0, left: 0, bottomleft: true),
                    _corner(bottom: 0, right: 0, bottomright: true),
                  ],
                ),
              ),
            ),
          ),

          // Instructions
          Positioned(
            bottom: 80,
            left: 0,
            right: 0,
            child: Column(
              children: [
                const Icon(Icons.qr_code_scanner_outlined,
                    color: AppTheme.accent, size: 28),
                const SizedBox(height: 10),
                const Text(
                  'Point camera at the QR code',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                Text(
                  'From: https://eventxcrm.com/api/attendance/…',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: Colors.white.withOpacity(0.55),
                      fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      );
    });
  }

  Widget _corner({
    double? top,
    double? bottom,
    double? left,
    double? right,
    bool topleft = false,
    bool topright = false,
    bool bottomleft = false,
    bool bottomright = false,
  }) {
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: Container(
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          border: Border(
            top: topleft || topright
                ? const BorderSide(color: AppTheme.accent, width: 4)
                : BorderSide.none,
            bottom: bottomleft || bottomright
                ? const BorderSide(color: AppTheme.accent, width: 4)
                : BorderSide.none,
            left: topleft || bottomleft
                ? const BorderSide(color: AppTheme.accent, width: 4)
                : BorderSide.none,
            right: topright || bottomright
                ? const BorderSide(color: AppTheme.accent, width: 4)
                : BorderSide.none,
          ),
        ),
      ),
    );
  }
}
