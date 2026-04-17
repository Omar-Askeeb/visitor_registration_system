import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../app/theme.dart';
import '../../core/services/settings_service.dart';
import 'settings_screen.dart';

class SettingsPinScreen extends StatefulWidget {
  const SettingsPinScreen({super.key});

  @override
  State<SettingsPinScreen> createState() => _SettingsPinScreenState();
}

class _SettingsPinScreenState extends State<SettingsPinScreen>
    with SingleTickerProviderStateMixin {
  final _settingsService = SettingsService();
  final List<TextEditingController> _pinCtrl =
      List.generate(4, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(4, (_) => FocusNode());
  bool _error = false;
  late AnimationController _shakeCtrl;
  late Animation<double> _shakeAnim;

  @override
  void initState() {
    super.initState();
    _shakeCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 400));
    _shakeAnim = Tween(begin: -8.0, end: 8.0).animate(
      CurvedAnimation(parent: _shakeCtrl, curve: Curves.elasticIn),
    );
    _settingsService.init().then((_) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        FocusScope.of(context).requestFocus(_focusNodes[0]);
      });
    });
  }

  @override
  void dispose() {
    _shakeCtrl.dispose();
    for (final c in _pinCtrl) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  String get _enteredPin =>
      _pinCtrl.map((c) => c.text).join();

  void _onDigitChanged(int index, String value) {
    if (value.length == 1 && index < 3) {
      FocusScope.of(context).requestFocus(_focusNodes[index + 1]);
    }
    if (_enteredPin.length == 4) {
      _verify();
    }
  }

  void _verify() async {
    await _settingsService.init();
    if (_enteredPin == _settingsService.settingsPin) {
      setState(() => _error = false);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const SettingsScreen()),
      );
    } else {
      _shakeCtrl.forward(from: 0);
      setState(() => _error = true);
      for (final c in _pinCtrl) {
        c.clear();
      }
      FocusScope.of(context).requestFocus(_focusNodes[0]);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Enter PIN'),
        backgroundColor: AppTheme.background,
        elevation: 0,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  color: AppTheme.surfaceLight,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppTheme.border),
                ),
                child: const Icon(Icons.lock_outline,
                    color: AppTheme.primary, size: 34),
              ),
              const SizedBox(height: 24),
              Text(
                'Settings PIN',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'Enter your 4-digit PIN to access settings',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              AnimatedBuilder(
                animation: _shakeAnim,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(_error ? _shakeAnim.value : 0, 0),
                    child: child,
                  );
                },
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(4, (index) {
                    return Container(
                      width: 60,
                      height: 70,
                      margin: const EdgeInsets.symmetric(horizontal: 6),
                      child: TextFormField(
                        controller: _pinCtrl[index],
                        focusNode: _focusNodes[index],
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        obscureText: true,
                        maxLength: 1,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly
                        ],
                        decoration: InputDecoration(
                          counterText: '',
                          filled: true,
                          fillColor: _error
                              ? AppTheme.error.withOpacity(0.12)
                              : AppTheme.surfaceLight,
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: _error ? AppTheme.error : AppTheme.border,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: _error ? AppTheme.error : AppTheme.primary,
                              width: 2,
                            ),
                          ),
                        ),
                        style: const TextStyle(
                          color: AppTheme.textPrimary,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                        onChanged: (value) => _onDigitChanged(index, value),
                        onTap: () {
                          _pinCtrl[index].clear();
                        },
                      ),
                    );
                  }),
                ),
              ),
              if (_error) ...[
                const SizedBox(height: 16),
                const Text(
                  'Incorrect PIN. Please try again.',
                  style: TextStyle(color: AppTheme.error, fontSize: 13),
                ),
              ],
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _enteredPin.length == 4 ? _verify : null,
                  child: const Text('Unlock Settings'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
