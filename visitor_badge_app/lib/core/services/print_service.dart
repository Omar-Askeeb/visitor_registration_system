import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:barcode/barcode.dart' as bc;
import '../models/visitor_model.dart';
import 'settings_service.dart';

class PrintService {
  final SettingsService _settings = SettingsService();

  /// Generate and print a badge PDF for a visitor
  Future<void> printBadge({
    required VisitorModel visitor,
    required String eventName,
    required int copies,
  }) async {
    await _settings.init();
    final pdf = pw.Document();
    final badgeId = visitor.badgeId ?? visitor.formId;

    // Read properties from settings
    final double pageWidth = _settings.pageWidth;
    final double pageHeight = _settings.pageHeight;
    final double bcWidthFactor = _settings.bcWidthFactor;
    final int bcHeightPx = _settings.bcHeightPx;
    final double posY = _settings.posY;

    // Generate barcode SVG
    final barcode = bc.Barcode.code128();
    final barcodeData = barcode.toSvg(
      badgeId,
      width: 200 * bcWidthFactor,
      height: bcHeightPx.toDouble(),
      drawText: false,
    );

    for (int i = 0; i < copies; i++) {
      pdf.addPage(
        pw.Page(
          pageFormat: PdfPageFormat(
            pageWidth * PdfPageFormat.cm,
            pageHeight * PdfPageFormat.cm,
            marginAll: 0, // Manual positioning using posY
          ),
          build: (context) => _buildBadge(
            context: context,
            visitor: visitor,
            eventName: eventName,
            badgeId: badgeId,
            barcodeData: barcodeData,
            posY: posY,
            bcWidth: 6 * PdfPageFormat.cm,
            bcHeight: bcHeightPx.toDouble(),
          ),
        ),
      );
    }

    await Printing.layoutPdf(
      onLayout: (format) async => pdf.save(),
      name: 'Badge_${visitor.displayName.replaceAll(' ', '_')}',
    );
  }

  pw.Widget _buildBadge({
    required pw.Context context,
    required VisitorModel visitor,
    required String eventName,
    required String badgeId,
    required String barcodeData,
    required double posY,
    required double bcWidth,
    required double bcHeight,
  }) {
    return pw.Container(
      width: double.infinity,
      padding: pw.EdgeInsets.only(top: posY * PdfPageFormat.cm),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.center,
        mainAxisSize: pw.MainAxisSize.min,
        children: [
          // Visitor full name
          pw.Text(
            visitor.displayName,
            style: pw.TextStyle(
              fontWeight: pw.FontWeight.bold,
              fontSize: 20, // Increased size for visibility
              color: PdfColors.black,
            ),
            textAlign: pw.TextAlign.center,
          ),
          if (visitor.organisation != null && visitor.organisation!.isNotEmpty)
            pw.Padding(
              padding: const pw.EdgeInsets.only(top: 2),
              child: pw.Text(
                visitor.organisation!,
                style: const pw.TextStyle(fontSize: 12, color: PdfColors.grey900),
                textAlign: pw.TextAlign.center,
              ),
            ),
          pw.SizedBox(height: 10),
          // Barcode
          pw.SvgImage(svg: barcodeData, width: bcWidth, height: bcHeight),
          // Badge ID text
          pw.Text(
            badgeId,
            style: const pw.TextStyle(
              fontSize: 10,
              color: PdfColors.black,
            ),
            textAlign: pw.TextAlign.center,
          ),
        ],
      ),
    );
  }

  /// Preview badge in a dialog (returns the PDF bytes)
  Future<List<int>> generateBadgePdf({
    required VisitorModel visitor,
    required String eventName,
  }) async {
    await _settings.init();
    final pdf = pw.Document();
    final badgeId = visitor.badgeId ?? visitor.formId;
    
    final double pageWidth = _settings.pageWidth;
    final double pageHeight = _settings.pageHeight;
    final double bcWidthFactor = _settings.bcWidthFactor;
    final int bcHeightPx = _settings.bcHeightPx;
    final double posY = _settings.posY;

    final barcode = bc.Barcode.code128();
    final barcodeData = barcode.toSvg(
      badgeId, 
      width: 200 * bcWidthFactor, 
      height: bcHeightPx.toDouble(), 
      drawText: false
    );

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat(
          pageWidth * PdfPageFormat.cm,
          pageHeight * PdfPageFormat.cm,
          marginAll: 0,
        ),
        build: (context) => _buildBadge(
          context: context,
          visitor: visitor,
          eventName: eventName,
          badgeId: badgeId,
          barcodeData: barcodeData,
          posY: posY,
          bcWidth: 6 * PdfPageFormat.cm,
          bcHeight: bcHeightPx.toDouble(),
        ),
      ),
    );
    return pdf.save();
  }
}
