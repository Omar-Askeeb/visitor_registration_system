import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/api/visitor_api.dart';
import '../../core/api/event_api.dart';
import '../../core/models/visitor_model.dart';
import '../../core/models/event_model.dart';
import '../../core/services/settings_service.dart';
import '../../core/services/print_service.dart';
import '../../core/utils/form_id_generator.dart';
import '../../widgets/loading_overlay.dart';
import '../../widgets/badge_preview.dart';
import '../../core/utils/constants.dart';

enum RegistrationStage { entry, review, success }

class ManualRegisterScreen extends StatefulWidget {
  // Localized Registration Screen (v2 - Arabic)
  const ManualRegisterScreen({super.key});

  @override
  State<ManualRegisterScreen> createState() => _ManualRegisterScreenState();
}

class _ManualRegisterScreenState extends State<ManualRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _settingsService = SettingsService();
  final _visitorApi = VisitorApi();
  final _eventApi = EventApi();
  final _printService = PrintService();

  // Form controllers
  final _firstNameCtrl = TextEditingController();
  final _midNameCtrl = TextEditingController();
  final _surNameCtrl = TextEditingController();
  final _orgCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phone1Ctrl = TextEditingController();
  final _phone2Ctrl = TextEditingController();
  final _otherNationalityCtrl = TextEditingController();
  final _otherResidentCtrl = TextEditingController();

  String _formId = '';
  String _badgeId = '';
  String _resident = 'ليبيا';
  String _nationality = 'ليبيا';
  String _gender = 'ذكر';
  bool _isLoading = false;
  bool _hasWhatsapp = false;
  int _currentStep = 0;
  String? _error;
  VisitorModel? _savedVisitor;
  
  // Static options from constants.dart
  final List<String> _workFields = List.from(workFields);
  final List<String> _howExpoSources = List.from(howExpoSources);
  List<String> _selectedWorkFields = [];
  List<String> _selectedHowExpo = [];

  RegistrationStage _stage = RegistrationStage.entry;
  VisitorModel? _tempVisitor; // For review screen

  // Focus nodes for auto-focus
  final _firstNameFocus = FocusNode();
  final _orgFocus = FocusNode();

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await _settingsService.init();
    await _fetchEventOptions();
    _fetchNextBadgeId();
    _applyStepFocus();
  }

  Future<void> _fetchEventOptions() async {
    // Note: Options are now static from constants.dart
    // Keeping this method empty for consistency if we want to fetch other event data later.
  }

  Future<void> _fetchNextBadgeId() async {
    final eventId = _settingsService.eventId;
    if (eventId == null) return;
    try {
      final prefix = _settingsService.badgePrefix;
      final id = await _visitorApi.getNextBadgeId(eventId, prefix);
      setState(() => _badgeId = id);
    } catch (_) {}
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _midNameCtrl.dispose();
    _surNameCtrl.dispose();
    _orgCtrl.dispose();
    _emailCtrl.dispose();
    _phone1Ctrl.dispose();
    _phone2Ctrl.dispose();
    _otherNationalityCtrl.dispose();
    _otherResidentCtrl.dispose();
    _firstNameFocus.dispose();
    _orgFocus.dispose();
    super.dispose();
  }

  Future<void> _toReview() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() {
      _error = null;
      _tempVisitor = VisitorModel(
        formId: '...', // Placeholder until confirm
        visitorName: _firstNameCtrl.text.trim(),
        midleName: _midNameCtrl.text.trim(),
        surName: _surNameCtrl.text.trim(),
        organisation: _orgCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        phone1: _phone1Ctrl.text.trim(),
        hasWhatsapp: _hasWhatsapp,
        phone2: _phone2Ctrl.text.trim(),
        gender: _gender,
        nationality: _nationality == 'أخرى' ? _otherNationalityCtrl.text.trim() : _nationality,
        resident: _resident == 'أخرى' ? _otherResidentCtrl.text.trim() : _resident,
        workfield: _selectedWorkFields,
        howexpo: _selectedHowExpo,
      );
      _stage = RegistrationStage.review;
    });
  }

  bool _validateCurrentStep() {
    if (_currentStep == 0) {
      if (_firstNameCtrl.text.trim().isEmpty) return false;
      if (_surNameCtrl.text.trim().isEmpty) return false;
      return true;
    } else if (_currentStep == 1) {
      final org = _orgCtrl.text.trim();
      final p1 = _phone1Ctrl.text.trim();
      
      if (org.isEmpty) return false;
      if (p1.isEmpty) return false;
      
      // Mobile Number Validation
      final prefixes = ['091', '092', '093', '094', '095'];
      bool hasTargetPrefix = false;
      for (var prefix in prefixes) {
        if (p1.startsWith(prefix)) {
          hasTargetPrefix = true;
          break;
        }
      }
      
      if (hasTargetPrefix && p1.length != 10) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('رقم الهاتف يجب أن يتكون من 10 أرقام')),
        );
        return false;
      }
      
      return true;
    }
    return true; // Steps 2 and 3 are usually optional selection groups
  }

  void _nextStep() {
    if (!_validateCurrentStep()) {
      if (_currentStep == 0 || _currentStep == 1) {
        // Validation messages are handled in _validateCurrentStep or implicitly
        if (_firstNameCtrl.text.isEmpty || _surNameCtrl.text.isEmpty || (_currentStep == 1 && _orgCtrl.text.isEmpty)) {
           ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('يرجى إكمال الحقول المطلوبة')),
          );
        }
      }
      return;
    }
    if (_currentStep < 3) {
      setState(() => _currentStep++);
      _applyStepFocus();
    } else {
      _toReview();
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
      _applyStepFocus();
    }
  }

  void _applyStepFocus() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_currentStep == 0) {
        _firstNameFocus.requestFocus();
      } else if (_currentStep == 1) {
        _orgFocus.requestFocus();
      }
    });
  }

  Future<void> _confirmSave() async {
    final eventId = _settingsService.eventId;
    if (eventId <= 0) {
      setState(() => _error = 'يرجى تحديد تفاصيل الفعالية في الإعدادات أولاً');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // 1. Fetch Sequential IDs
      final fPrefix = _settingsService.selfRegPrefix.isNotEmpty 
          ? _settingsService.selfRegPrefix 
          : _settingsService.formPrefix;
      
      final iterativeId = await _visitorApi.getNextFormId(eventId, fPrefix);
      
      final bPrefix = _settingsService.badgePrefix;
      final iterativeBadgeId = await _visitorApi.getNextBadgeId(eventId, bPrefix);

      // 2. Prepare final model
      final visitorModel = _tempVisitor!.copyWith(
        formId: iterativeId,
        badgeId: iterativeBadgeId,
      );

      // 3. Store
      final visitor = await _visitorApi.store(eventId, visitorModel);
      
      if (mounted) {
        setState(() {
          _savedVisitor = visitor;
          _stage = RegistrationStage.success;
          _isLoading = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم الحفظ بنجاح', textAlign: TextAlign.center),
            backgroundColor: AppTheme.accent,
            duration: Duration(seconds: 2),
          ),
        );

        // 4. Trigger Printing (System Dialog)
        // The app will wait here until the print dialog is closed
        try {
          await _printService.printBadge(
            visitor: visitor,
            eventName: _settingsService.eventName,
            copies: _settingsService.badgeCopies,
          );
          
          // 5. Increment print count after dialog is handled
          final vid = visitor.id;
          if (vid != null) {
            await _visitorApi.incrementPrintCount(eventId, vid);
          }
        } catch (pe) {
          debugPrint('Print error: $pe');
        }
      }
    } catch (e) {

      debugPrint('ConfirmSave Error: $e');
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _isLoading = false;
        });
        
        // Show a dialog for critical DB errors to ensure visibility
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('خطأ في الحفظ', style: TextStyle(color: AppTheme.error)),
            content: Text('حدث خطأ أثناء محاولة حفظ البيانات:\n\n$e'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('موافق')),
            ],
          ),
        );
      }
    }
  }


  void _showBadgeDialog(VisitorModel visitor) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => _BadgePrintDialog(
        visitor: visitor,
        eventName: _settingsService.eventName,
        copies: _settingsService.badgeCopies,
        onPrint: () async {
          await _printService.printBadge(
            visitor: visitor,
            eventName: _settingsService.eventName,
            copies: _settingsService.badgeCopies,
          );
          final id = visitor.id;
          final eventId = _settingsService.eventId;
          if (id != null) {
            await _visitorApi.incrementPrintCount(eventId, id);
          }
        },
        onNewRegistration: () {
          Navigator.of(context).pop(); // close dialog
          _resetForm();
        },
      ),
    );
  }

  void _resetForm() {
    setState(() {
      _stage = RegistrationStage.entry;
      _tempVisitor = null;
      _gender = 'ذكر';
      _nationality = 'ليبيا';
      _resident = 'ليبيا';
      _savedVisitor = null;
      _error = null;
      _selectedWorkFields = [];
      _selectedHowExpo = [];
      _currentStep = 0;
      _hasWhatsapp = false;
    });
    _firstNameCtrl.clear();
    _midNameCtrl.clear();
    _surNameCtrl.clear();
    _orgCtrl.clear();
    _emailCtrl.clear();
    _phone1Ctrl.clear();
    _phone2Ctrl.clear();
    _otherNationalityCtrl.clear();
    _otherResidentCtrl.clear();
    _fetchNextBadgeId();
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(
          title: Text(_stage == RegistrationStage.entry 
              ? 'تسجيل الزوار' 
              : _stage == RegistrationStage.review 
                  ? 'مراجعة البيانات' 
                  : 'تم بنجاح'),
          leading: _stage == RegistrationStage.review 
              ? IconButton(
                  icon: const Icon(Icons.arrow_forward), // Arrow forward for RTL back
                  onPressed: () => setState(() => _stage = RegistrationStage.entry),
                )
              : null,
          actions: [
            if (_stage == RegistrationStage.entry)
              IconButton(
                icon: const Icon(Icons.settings_outlined),
                tooltip: 'الإعدادات',
                onPressed: () {
                  Navigator.of(context).pushNamed('/settings_pin').then((_) => _init());
                },
              ),
            TextButton.icon(
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('جديد'),
              style: TextButton.styleFrom(foregroundColor: AppTheme.accent),
              onPressed: _resetForm,
            ),
          ],
        ),
        body: LoadingOverlay(
          isLoading: _isLoading,
          message: 'جاري الحفظ…',
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: _buildStageContent(),
          ),
        ),
      ),
    );
  }

  Widget _buildStageContent() {
    switch (_stage) {
      case RegistrationStage.review:
        return _buildReviewScreen();
      case RegistrationStage.success:
        return _buildSuccessScreen();
      case RegistrationStage.entry:
      default:
        return _buildEntryForm();
    }
  }

  Widget _buildStepIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      child: Center(
        child: IntrinsicWidth(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: List.generate(4, (index) {
              bool active = index == _currentStep;
              bool completed = index < _currentStep;
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 32, height: 32,
                    decoration: BoxDecoration(
                      color: active ? AppTheme.accent : (completed ? AppTheme.primary : AppTheme.surfaceLight),
                      shape: BoxShape.circle,
                      border: Border.all(color: active || completed ? Colors.transparent : AppTheme.border, width: 1.5),
                    ),
                    child: Center(
                      child: completed 
                        ? const Icon(Icons.check, size: 16, color: Colors.white)
                        : Text('${index + 1}', style: TextStyle(color: active || completed ? Colors.white : AppTheme.textSecondary, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  if (index < 3) 
                    Container(
                      width: 40,
                      height: 2,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      color: completed ? AppTheme.primary : AppTheme.border,
                    ),
                ],
              );
            }),
          ),
        ),
      ),
    );
  }

  Widget _buildEntryForm() {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          _buildStepIndicator(),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              children: [
                if (_currentStep == 0) _buildStep1Personal(),
                if (_currentStep == 1) _buildStep2Contact(),
                if (_currentStep == 2) _buildStep3WorkFields(),
                if (_currentStep == 3) _buildStep4InfoSource(),
              ],
            ),
          ),
          _buildStepNavigation(),
        ],
      ),
    );
  }

  Widget _buildStep1Personal() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('المعلومات الشخصية'),
        const SizedBox(height: 12),
        _buildField(
          controller: _firstNameCtrl,
          focusNode: _firstNameFocus,
          autofocus: true,
          label: 'الاسم الأول *',
          hint: 'الاسم الأول',
          required: true,
        ),
        const SizedBox(height: 14),
        _buildField(
          controller: _midNameCtrl,
          label: 'اسم الأب',
          hint: 'اسم الأب (اختياري)',
        ),
        const SizedBox(height: 14),
        _buildField(
          controller: _surNameCtrl,
          label: 'اللقب *',
          hint: 'اسم العائلة',
          required: true,
        ),
        const SizedBox(height: 14),
        _buildGenderPicker(),
        const SizedBox(height: 14),
        _buildRow(
          _buildDropdownField(
            label: 'الجنسية *',
            value: _nationality,
            items: countries,
            onChanged: (v) => setState(() => _nationality = v!),
          ),
          _buildDropdownField(
            label: 'دولة الإقامة *',
            value: _resident,
            items: countries,
            onChanged: (v) => setState(() => _resident = v!),
          ),
        ),
        if (_nationality == 'أخرى' || _resident == 'أخرى') ...[
          const SizedBox(height: 14),
          _buildRow(
            _nationality == 'أخرى'
                ? _buildField(
                    controller: _otherNationalityCtrl,
                    label: 'جنسية أخرى',
                    hint: 'ادخل الجنسية',
                    required: true,
                  )
                : const SizedBox(),
            _resident == 'أخرى'
                ? _buildField(
                    controller: _otherResidentCtrl,
                    label: 'بلد إقامة آخر',
                    hint: 'ادخل بلد الإقامة',
                    required: true,
                  )
                : const SizedBox(),
          ),
        ],
      ],
    );
  }

  Widget _buildStep2Contact() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('بيانات الاتصال وجهة العمل'),
        const SizedBox(height: 12),
        _buildField(
          controller: _orgCtrl,
          focusNode: _orgFocus,
          autofocus: true,
          label: 'جهة العمل *',
          hint: 'اسم الشركة / الجهة',
          required: true,
        ),
        const SizedBox(height: 14),
        _buildField(
          controller: _emailCtrl,
          label: 'البريد الإلكتروني',
          hint: 'email@example.com',
          keyboardType: TextInputType.emailAddress,
          textDirection: TextDirection.ltr,
        ),
        const SizedBox(height: 14),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              flex: 3,
              child: _buildField(
                controller: _phone1Ctrl,
                label: 'رقم الهاتف *',
                hint: '+2189xxxxxxxxx',
                keyboardType: TextInputType.phone,
                textDirection: TextDirection.ltr,
                required: true,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              margin: const EdgeInsets.only(bottom: 4),
              child: Row(
                children: [
                  Checkbox(
                    value: _hasWhatsapp,
                    onChanged: (v) => setState(() => _hasWhatsapp = v ?? false),
                    activeColor: AppTheme.accent,
                  ),
                  const Text('لديك عليه وتس اب', style: TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        _buildField(
          controller: _phone2Ctrl,
          label: 'الهاتف الثاني',
          hint: 'اختياري',
          keyboardType: TextInputType.phone,
          textDirection: TextDirection.ltr,
        ),
      ],
    );
  }

  Widget _buildStep3WorkFields() {
    return Column(
      children: [
        if (_workFields.isNotEmpty)
          _buildCheckboxGroup('مجالات العمل', _workFields, _selectedWorkFields),
      ],
    );
  }

  Widget _buildStep4InfoSource() {
    return Column(
      children: [
        if (_howExpoSources.isNotEmpty)
          _buildCheckboxGroup('كيف علمت بالمعرض؟', _howExpoSources, _selectedHowExpo),
      ],
    );
  }

  Widget _buildStepNavigation() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5)),
        ],
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: _previousStep,
                child: const Text('السابق'),
                style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton.icon(
              icon: Icon(_currentStep < 3 ? Icons.chevron_left : Icons.check_circle_outline),
              label: Text(_currentStep < 3 ? 'التالي' : 'مراجعة وتأكيد',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              onPressed: _isLoading ? null : _nextStep,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: _currentStep < 3 ? AppTheme.primary : AppTheme.accent,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewScreen() {
    if (_tempVisitor == null) return const SizedBox();
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Icon(Icons.assignment_ind_outlined, color: AppTheme.primary, size: 48),
        const SizedBox(height: 16),
        const Text(
          'يرجى التأكد من البيانات التالية',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 24),
        Card(
          elevation: 0,
          color: AppTheme.surfaceLight,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: AppTheme.border)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                _buildReviewItem('الاسم', _tempVisitor!.displayName),
                _buildReviewItem('الجهة / العمل', _tempVisitor!.organisation ?? '-'),
                _buildReviewItem('البريد', _tempVisitor!.email ?? '-'),
                _buildReviewItem('الهاتف', _tempVisitor!.phone1 ?? '-'),
                _buildReviewItem('الجنس', _tempVisitor!.gender ?? '-'),
                _buildReviewItem('الجنسية', _tempVisitor!.nationality ?? '-'),
                _buildReviewItem('بلد الإقامة', _tempVisitor!.resident ?? '-'),
                if (_tempVisitor!.workfield.isNotEmpty)
                  _buildReviewItem('مجالات العمل', _tempVisitor!.workfield.join('، ')),
                if (_tempVisitor!.howexpo.isNotEmpty)
                  _buildReviewItem('كيف علمت بالمعرض', _tempVisitor!.howexpo.join('، ')),
              ],
            ),
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.error.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.error.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline, color: AppTheme.error, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _error!,
                    style: const TextStyle(color: AppTheme.error, fontSize: 13, fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 32),
        ElevatedButton.icon(

          icon: const Icon(Icons.check_circle_outline),
          label: const Text('تأكيد وحفظ', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          onPressed: _isLoading ? null : _confirmSave,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.accent,
            padding: const EdgeInsets.symmetric(vertical: 18),
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton(
          onPressed: () => setState(() => _stage = RegistrationStage.entry),
          child: const Text('العودة للتعديل'),
          style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
        ),
      ],
    );
  }

  Widget _buildReviewItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 100, child: Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontWeight: FontWeight.w500))),
          Expanded(child: Text(value, style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }

  Widget _buildSuccessScreen() {
    if (_savedVisitor == null) return const SizedBox();
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(color: AppTheme.accent.withOpacity(0.15), shape: BoxShape.circle),
              child: const Icon(Icons.done_all, color: AppTheme.accent, size: 40),
            ),
            const SizedBox(height: 24),
            const Text('اكتمل التسجيل بنجاح!', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('كود التسجيل: ${_savedVisitor!.formId}', style: const TextStyle(fontSize: 18, color: AppTheme.primary, fontWeight: FontWeight.w700)),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: AppTheme.surfaceLight, borderRadius: BorderRadius.circular(16)),
              child: BadgePreview(visitor: _savedVisitor!, eventName: _settingsService.eventName),
            ),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      _printService.printBadge(
                        visitor: _savedVisitor!,
                        eventName: _settingsService.eventName,
                        copies: _settingsService.badgeCopies,
                      );
                    },
                    icon: const Icon(Icons.print),
                    label: const Text('طباعة البطاقة'),
                    style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _resetForm,
                    icon: const Icon(Icons.add),
                    label: const Text('تسجيل جديد'),
                    style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String value,
    required List<String> items,
    required void Function(String?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w500)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: value,
          isExpanded: true,
          onChanged: onChanged,
          items: items.map((c) {
            return DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 14)));
          }).toList(),
          decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
        ),
      ],
    );
  }

  Widget _buildIdRow() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildIdCell(
                icon: Icons.article_outlined,
                label: 'كود التسجيل',
                value: _savedVisitor?.formId ?? '...'),
          ),
          Container(
              width: 1, height: 40, color: AppTheme.primary.withOpacity(0.3)),
          Expanded(
            child: _buildIdCell(
                icon: Icons.badge_outlined,
                label: 'رقم البطاقة',
                value: _savedVisitor?.badgeId ?? '...'),
          ),
        ],
      ),
    );
  }

  Widget _buildIdCell(
      {required IconData icon, required String label, required String value}) {
    return Column(
      children: [
        Icon(icon, color: AppTheme.primary, size: 20),
        const SizedBox(height: 4),
        Text(label,
            style: const TextStyle(
                color: AppTheme.textSecondary, fontSize: 11)),
        const SizedBox(height: 4),
        Text(value,
            style: const TextStyle(
                color: AppTheme.primary,
                fontWeight: FontWeight.w700,
                fontSize: 13),
            textAlign: TextAlign.center),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(title,
        style: const TextStyle(
            color: AppTheme.textPrimary,
            fontWeight: FontWeight.w700,
            fontSize: 15));
  }

  Widget _buildRow(Widget a, Widget b) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: a),
        const SizedBox(width: 14),
        Expanded(child: b),
      ],
    );
  }

  Widget _buildField({
    TextEditingController? controller,
    FocusNode? focusNode,
    bool autofocus = false,
    required String label,
    String? hint,
    bool required = false,
    TextInputType? keyboardType,
    TextDirection? textDirection,
    void Function(String)? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w500)),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          focusNode: focusNode,
          autofocus: autofocus,
          keyboardType: keyboardType,
          textDirection: textDirection,
          style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
          decoration: InputDecoration(hintText: hint),
          validator: required
              ? (v) =>
                  (v == null || v.isEmpty) ? 'This field is required' : null
              : null,
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildGenderPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('الجنس',
            style: TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        Row(
          children: [
            _buildGenderOption('ذكر', 'ذكر'),
            _buildGenderOption('أنثى', 'أنثى'),
          ],
        ),
      ],
    );
  }

  Widget _buildGenderOption(String label, String value) {
    final selected = _gender == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _gender = value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected
                ? AppTheme.primary.withOpacity(0.15)
                : AppTheme.surfaceLight,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected ? AppTheme.primary : AppTheme.border,
              width: selected ? 2 : 1,
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: selected ? AppTheme.primary : AppTheme.textSecondary,
              fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCheckboxGroup(String title, List<String> options, List<String> selections) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle(title),
          const SizedBox(height: 12),
          ...options.map((opt) {
            final isSelected = selections.contains(opt);
            return InkWell(
              onTap: () {
                setState(() {
                  if (isSelected) {
                    selections.remove(opt);
                  } else {
                    selections.add(opt);
                  }
                });
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.accent : Colors.transparent,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: isSelected ? AppTheme.accent : AppTheme.border,
                          width: 1.5,
                        ),
                      ),
                      child: isSelected
                          ? const Icon(Icons.check, color: Colors.white, size: 16)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        opt,
                        style: TextStyle(
                          color: isSelected ? AppTheme.textPrimary : AppTheme.textSecondary,
                          fontSize: 14,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ------------------------------------------------------------------
// Badge Print Dialog
// ------------------------------------------------------------------
class _BadgePrintDialog extends StatefulWidget {
  final VisitorModel visitor;
  final String eventName;
  final int copies;
  final Future<void> Function() onPrint;
  final VoidCallback onNewRegistration;

  const _BadgePrintDialog({
    required this.visitor,
    required this.eventName,
    required this.copies,
    required this.onPrint,
    required this.onNewRegistration,
  });

  @override
  State<_BadgePrintDialog> createState() => _BadgePrintDialogState();
}

class _BadgePrintDialogState extends State<_BadgePrintDialog> {
  bool _isPrinting = false;

  Future<void> _doPrint() async {
    setState(() => _isPrinting = true);
    try {
      await widget.onPrint();
    } finally {
      if (mounted) setState(() => _isPrinting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppTheme.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Success icon
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: AppTheme.accent.withOpacity(0.15),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(Icons.check_circle_outline,
                  color: AppTheme.accent, size: 34),
            ),
            const SizedBox(height: 16),
            const Text(
              'تم حفظ التسجيل!',
              style: TextStyle(
                  color: AppTheme.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              widget.visitor.displayName,
              style: const TextStyle(
                  color: AppTheme.accent,
                  fontSize: 16,
                  fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
            ),
            if (widget.visitor.organisation != null &&
                widget.visitor.organisation!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(widget.visitor.organisation!,
                  style: const TextStyle(
                      color: AppTheme.textSecondary, fontSize: 13)),
            ],
            const SizedBox(height: 6),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                widget.visitor.badgeId ?? widget.visitor.formId,
                style: const TextStyle(
                    color: AppTheme.primary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(height: 24),
            // Badge preview
            BadgePreview(
                visitor: widget.visitor, eventName: widget.eventName),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.add_circle_outline, size: 18),
                    label: const Text('جديد'),
                    onPressed: widget.onNewRegistration,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    icon: _isPrinting
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.print_outlined, size: 18),
                    label: Text(_isPrinting ? 'جاري الطباعة…' : 'طباعة البطاقة'),
                    onPressed: _isPrinting ? null : _doPrint,
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
