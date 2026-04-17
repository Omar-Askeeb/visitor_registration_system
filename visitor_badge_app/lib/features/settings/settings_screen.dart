import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/api/auth_api.dart';
import '../../core/api/event_api.dart';
import '../../core/models/event_model.dart';
import '../../core/services/settings_service.dart';
import '../../core/services/sql_database_service.dart';
import '../../widgets/loading_overlay.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final SettingsService _settings = SettingsService();
  final AuthApi _authApi = AuthApi();
  final EventApi _eventApi = EventApi();

  final _hostController = TextEditingController();
  final _portController = TextEditingController();
  final _userController = TextEditingController();
  final _passwordController = TextEditingController();
  final _dbNameController = TextEditingController();

  final _identifierController = TextEditingController();
  final _operatorPasswordController = TextEditingController();
  final _userIdController = TextEditingController();
  final _pinController = TextEditingController();
  
  final _pageWidthCtrl = TextEditingController();
  final _pageHeightCtrl = TextEditingController();
  final _bcWidthFactorCtrl = TextEditingController();
  final _bcHeightPxCtrl = TextEditingController();
  final _posYCtrl = TextEditingController();
  
  AppMode _selectedMode = AppMode.selfServe;
  int _badgeCopies = 1;
  List<EventModel> _events = [];
  EventModel? _selectedEvent;
  bool _isLoading = false;

  bool _showDbPassword = false;
  bool _showOperatorPassword = false;
  bool _showPin = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    await _settings.init();
    setState(() {
      _hostController.text = _settings.dbHost;
      _portController.text = _settings.dbPort.toString();
      _userController.text = _settings.dbUser;
      _passwordController.text = _settings.dbPassword;
      _dbNameController.text = _settings.dbName;

      _identifierController.text = _settings.operatorIdentifier;
      _operatorPasswordController.text = _settings.operatorPassword;
      _userIdController.text = _settings.operatorUserId > 0 ? _settings.operatorUserId.toString() : '';
      _pinController.text = _settings.settingsPin;
      
      _selectedMode = _settings.appMode;
      _badgeCopies = _settings.badgeCopies;

      _pageWidthCtrl.text = _settings.pageWidth.toString();
      _pageHeightCtrl.text = _settings.pageHeight.toString();
      _bcWidthFactorCtrl.text = _settings.bcWidthFactor.toString();
      _bcHeightPxCtrl.text = _settings.bcHeightPx.toString();
      _posYCtrl.text = _settings.posY.toString();
    });

    if (_settings.isDbConfigured) {
      _fetchEvents();
    }
  }

  Future<void> _testConnection() async {
    if (_hostController.text.isEmpty || _userController.text.isEmpty) {
      _showError('Host and User are required');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await SqlDatabaseService.testConnection(
        host: _hostController.text.trim(),
        port: int.tryParse(_portController.text) ?? 3306,
        user: _userController.text.trim(),
        password: _passwordController.text,
        db: _dbNameController.text.trim(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Database Connection Successful!'),
            backgroundColor: AppTheme.accent,
          ),
        );
      }
    } catch (e) {
      _showError('Connection Failed: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchEvents() async {
    setState(() => _isLoading = true);
    
    // Temporarily save DB settings to allow the Api to connect
    await _settings.setDbHost(_hostController.text.trim());
    await _settings.setDbPort(int.tryParse(_portController.text) ?? 3306);
    await _settings.setDbUser(_userController.text.trim());
    await _settings.setDbPassword(_passwordController.text);
    await _settings.setDbName(_dbNameController.text.trim());
    
    // Reset connection pool to use new settings
    await SqlDatabaseService.close();

    try {
      final events = await _eventApi.listEvents();
      setState(() {
        _events = events;
        if (_settings.eventId > 0) {
          _selectedEvent = events.firstWhere(
            (e) => e.id == _settings.eventId,
            orElse: () => events.first,
          );
        } else if (events.isNotEmpty) {
          _selectedEvent = events.first;
        }
      });
    } catch (e) {
      _showError('Error loading events: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _verifyOperator() async {
    if (_identifierController.text.isEmpty || _operatorPasswordController.text.isEmpty) {
      _showError('Operator credentials required');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final authData = await _authApi.login(
        _identifierController.text.trim(), 
        _operatorPasswordController.text
      );
      
      final user = authData['user'];
      if (user != null && user['id'] != null) {
        setState(() {
          _userIdController.text = user['id'].toString();
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Operator Verified!')),
          );
        }
      }
    } catch (e) {
      _showError('Operator Verification Failed: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppTheme.error),
    );
  }

  Future<void> _saveSettings() async {
    if (_hostController.text.isEmpty || _selectedEvent == null) {
      _showError('Please complete DB setup and select an event');
      return;
    }

    setState(() => _isLoading = true);
    try {
      // 1. Save DB
      await _settings.setDbHost(_hostController.text.trim());
      await _settings.setDbPort(int.tryParse(_portController.text) ?? 3306);
      await _settings.setDbUser(_userController.text.trim());
      await _settings.setDbPassword(_passwordController.text);
      await _settings.setDbName(_dbNameController.text.trim());

      // 2. Save Operator
      await _settings.setOperatorIdentifier(_identifierController.text.trim());
      await _settings.setOperatorPassword(_operatorPasswordController.text);
      await _settings.setOperatorUserId(int.tryParse(_userIdController.text) ?? 0);
      
      // 3. Save App Config
      await _settings.setSettingsPin(_pinController.text);
      await _settings.setAppMode(_selectedMode);
      await _settings.setBadgeCopies(_badgeCopies);
      
      // 4. Save Event Cache
      await _settings.setEventId(_selectedEvent!.id);
      await _settings.setEventName(_selectedEvent!.name);

      await _settings.setBadgePrefix(_selectedEvent!.badgeIdPrefix);
      await _settings.setFormPrefix(_selectedEvent!.formIdPrefix);
      await _settings.setSelfRegPrefix(_selectedEvent!.selfRegPrefix);

      await _settings.setPageWidth(double.tryParse(_pageWidthCtrl.text) ?? 21.0);
      await _settings.setPageHeight(double.tryParse(_pageHeightCtrl.text) ?? 27.0);
      await _settings.setBcWidthFactor(double.tryParse(_bcWidthFactorCtrl.text) ?? 1.8);
      await _settings.setBcHeightPx(int.tryParse(_bcHeightPxCtrl.text) ?? 50);
      await _settings.setPosY(double.tryParse(_posYCtrl.text) ?? 6.5);

      // Close connection to force new one with saved settings
      await SqlDatabaseService.close();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Settings saved successfully!')),
      );
      
      // Direct navigation
      if (_selectedMode == AppMode.selfServe) {
        Navigator.of(context).pushReplacementNamed('/manual_register');
      } else {
        Navigator.of(context).pushReplacementNamed('/qr_scanner');
      }
    } catch (e) {
      _showError('Save failed: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return LoadingOverlay(
      isLoading: _isLoading,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Direct DB Configuration'),
          actions: [
            IconButton(
              icon: const Icon(Icons.check),
              onPressed: _saveSettings,
            ),
          ],
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo
              Center(
                child: Container(
                  width: 80, height: 80,
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: Colors.white, borderRadius: BorderRadius.circular(16),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.asset('assets/images/logo.png', fit: BoxFit.contain),
                  ),
                ),
              ),

              _buildSectionTitle('MySQL Database Connection'),
              _buildTextField(
                controller: _hostController,
                label: 'Host / IP',
                hint: 'e.g. 192.168.1.100',
                icon: Icons.dns_outlined,
              ),
              const SizedBox(height: 12),
              _buildRow(
                _buildTextField(
                  controller: _portController,
                  label: 'Port',
                  hint: '3306',
                  icon: Icons.numbers,
                  keyboardType: TextInputType.number,
                ),
                _buildTextField(
                  controller: _dbNameController,
                  label: 'Database Name',
                  hint: 'visitor_db',
                  icon: Icons.storage,
                ),
              ),
              const SizedBox(height: 12),
              _buildTextField(
                controller: _userController,
                label: 'User',
                hint: 'db_user',
                icon: Icons.account_circle_outlined,
              ),
              const SizedBox(height: 12),
              _buildTextField(
                controller: _passwordController,
                label: 'Password',
                hint: 'db_password',
                icon: Icons.password_outlined,
                obscureText: !_showDbPassword,
                suffixIcon: IconButton(
                  icon: Icon(_showDbPassword ? Icons.visibility : Icons.visibility_off, size: 20),
                  onPressed: () => setState(() => _showDbPassword = !_showDbPassword),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _testConnection,
                      icon: const Icon(Icons.flash_on, size: 18),
                      label: const Text('Confirm'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.accent,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _fetchEvents,
                      icon: const Icon(Icons.refresh, size: 18),
                      label: const Text('Load Events'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              
              _buildSectionTitle('Operator Credentials (iPad User)'),
              _buildTextField(
                controller: _identifierController,
                label: 'Email / Phone',
                hint: 'Enter your ID',
                icon: Icons.person_pin_outlined,
              ),
              const SizedBox(height: 12),
              _buildTextField(
                controller: _operatorPasswordController,
                label: 'Operator Password',
                hint: '••••',
                icon: Icons.vpn_key_outlined,
                obscureText: !_showOperatorPassword,
                suffixIcon: IconButton(
                  icon: Icon(_showOperatorPassword ? Icons.visibility : Icons.visibility_off, size: 20),
                  onPressed: () => setState(() => _showOperatorPassword = !_showOperatorPassword),
                ),
              ),
              const SizedBox(height: 12),
              _buildRow(
                _buildTextField(
                  controller: _userIdController,
                  label: 'Assigned User ID',
                  hint: 'Auto-verified',
                  icon: Icons.fingerprint,
                  readOnly: true,
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: TextButton.icon(
                    onPressed: _verifyOperator,
                    icon: const Icon(Icons.how_to_reg),
                    label: const Text('Verify User'),
                  ),
                ),
              ),
              const SizedBox(height: 32),

              if (_events.isNotEmpty) ...[
                _buildSectionTitle('Event Selection'),
                DropdownButtonFormField<EventModel>(
                  value: _selectedEvent,
                  items: _events.map((e) {
                    return DropdownMenuItem(value: e, child: Text(e.name));
                  }).toList(),
                  onChanged: (val) => setState(() => _selectedEvent = val),
                  decoration: const InputDecoration(labelText: 'Active Event', prefixIcon: Icon(Icons.event)),
                ),
                const SizedBox(height: 32),
              ],

              _buildSectionTitle('App Operation Mode'),
              SegmentedButton<AppMode>(
                segments: const [
                  ButtonSegment(value: AppMode.selfServe, label: Text('Self-Serve'), icon: Icon(Icons.edit_note)),
                  ButtonSegment(value: AppMode.onlineRegister, label: Text('Online Scan'), icon: Icon(Icons.qr_code_scanner)),
                ],
                selected: {_selectedMode},
                onSelectionChanged: (set) => setState(() => _selectedMode = set.first),
              ),
              const SizedBox(height: 32),

              _buildSectionTitle('Security & Printing'),
              _buildTextField(
                controller: _pinController,
                label: 'Settings access PIN',
                icon: Icons.lock_outline,
                obscureText: !_showPin,
                suffixIcon: IconButton(
                  icon: Icon(_showPin ? Icons.visibility : Icons.visibility_off, size: 20),
                  onPressed: () => setState(() => _showPin = !_showPin),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.copy, color: AppTheme.textSecondary, size: 20),
                  const SizedBox(width: 12),
                  const Text('Copies:', style: TextStyle(fontSize: 16)),
                  const Spacer(),
                  IconButton(onPressed: () => setState(() => _badgeCopies > 1 ? _badgeCopies-- : null), icon: const Icon(Icons.remove_circle_outline)),
                  Text('$_badgeCopies', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  IconButton(onPressed: () => setState(() => _badgeCopies++), icon: const Icon(Icons.add_circle_outline)),
                ],
              ),
              const SizedBox(height: 32),

              _buildSectionTitle('Physical Properties (Printing)'),
              _buildRow(
                _buildTextField(
                  controller: _pageWidthCtrl,
                  label: 'Page Width (CM)',
                  hint: '21',
                  icon: Icons.width_normal,
                  keyboardType: TextInputType.number,
                ),
                _buildTextField(
                  controller: _pageHeightCtrl,
                  label: 'Page Height (CM)',
                  hint: '27',
                  icon: Icons.height,
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(height: 12),
              _buildRow(
                _buildTextField(
                  controller: _bcWidthFactorCtrl,
                  label: 'BC Width Factor',
                  hint: '1.8',
                  icon: Icons.linear_scale,
                  keyboardType: TextInputType.number,
                ),
                _buildTextField(
                  controller: _bcHeightPxCtrl,
                  label: 'BC Height (PX)',
                  hint: '50',
                  icon: Icons.bar_chart_outlined,
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(height: 12),
              _buildTextField(
                controller: _posYCtrl,
                label: 'Position Y (CM)',
                hint: '6.5',
                icon: Icons.vertical_align_top,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 60),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(title.toUpperCase(), style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, letterSpacing: 1.2, fontSize: 13)),
    );
  }

  Widget _buildRow(Widget a, Widget b) {
    return Row(children: [Expanded(child: a), const SizedBox(width: 12), Expanded(child: b)]);
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    String? hint,
    required IconData icon,
    bool obscureText = false,
    bool readOnly = false,
    TextInputType keyboardType = TextInputType.text,
    Widget? suffixIcon,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      readOnly: readOnly,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon, size: 20),
        suffixIcon: suffixIcon,
      ),
    );
  }
}
