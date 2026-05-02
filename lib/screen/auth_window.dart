import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../services/api_client.dart';
import '../components/Footer.dart';
import '../components/Navbar.dart';

enum AuthMode { login, signup }

class AuthWindow extends StatefulWidget {
  const AuthWindow({super.key, required this.mode});

  final AuthMode mode;

  @override
  State<AuthWindow> createState() => _AuthWindowState();
}

class _AuthWindowState extends State<AuthWindow> {
  static const _emailPattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$';
  static const _minPasswordLength = 8;

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final ApiClient _apiClient = ApiClient();

  bool _rememberMe = false;
  bool _isSubmitting = false;
  AuthMode _mode = AuthMode.login;
  String _role = 'patient';

  @override
  void initState() {
    super.initState();
    _mode = widget.mode;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _apiClient.close();
    super.dispose();
  }

  String get _roleLabel {
    switch (_role) {
      case 'doctor':
        return 'Doctor';
      case 'admin':
        return 'Admin';
      default:
        return 'Patient';
    }
  }

  void _setMode(AuthMode nextMode) {
    setState(() {
      _mode = nextMode;
      if (_mode == AuthMode.signup && _role == 'admin') {
        _role = 'patient';
      }
    });
  }

  String? _validateName(String? value) {
    if (_mode == AuthMode.signup &&
        (value == null || value.trim().length < 2)) {
      return 'Please enter your full name.';
    }
    return null;
  }

  String? _validateEmail(String? value) {
    final email = value?.trim() ?? '';
    if (!RegExp(_emailPattern).hasMatch(email)) {
      return 'Please enter a valid email address.';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if ((value ?? '').length < _minPasswordLength) {
      return 'Password must be at least 8 characters.';
    }
    return null;
  }

  Future<void> _handleSubmit() async {
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final name = _nameController.text.trim();

    final baseUrl = const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000',
    );
    final path = _mode == AuthMode.login
      ? '/api/auth/login'
      : (_role == 'doctor' ? '/api/auth/signup-doctor' : '/api/auth/signup');

    try {
      final uri = Uri.parse('$baseUrl$path');
      final body = _mode == AuthMode.login
          ? {'email': email, 'password': password}
          : {'email': email, 'password': password, 'name': name};

      final resp = await _apiClient.postJson(uri, body: body);

      if (resp.statusCode == 200 || resp.statusCode == 201) {
        final data = resp.body.isNotEmpty ? jsonDecode(resp.body) as Map<String, dynamic> : <String, dynamic>{};
        final token = data['token'] as String?;
        if (token != null && token.isNotEmpty) {
          await _apiClient.saveToken(token);
          final prefs = await SharedPreferences.getInstance();
          await prefs.setBool('isLoggedIn', true);
          // Fetch profile and persist profilePicUrl for navbar
          try {
            await _fetchAndStoreProfile();
          } catch (_) {}
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _mode == AuthMode.login ? 'Signed in successfully.' : 'Account created successfully.',
            ),
            behavior: SnackBarBehavior.floating,
          ),
        );

        // Navigate after auth
        if (_mode == AuthMode.signup && _role == 'patient') {
          // Patient signup: navigate to onboarding
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              Navigator.of(context).pushReplacementNamed('/onboarding');
            }
          });
        } else if (_mode == AuthMode.login) {
          // Login: navigate directly to patient dashboard
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              Navigator.of(context).pushReplacementNamed('/patient-dashboard');
            }
          });
        } else {
          // Doctor signup: pop back to previous screen
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              Navigator.of(context).pop(true);
            }
          });
        }
      } else {
        String msg = 'Authentication failed';
        try {
          final err = jsonDecode(resp.body);
          msg = err['error'] ?? err['message'] ?? msg;
        } catch (_) {}

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Network error: $e'), behavior: SnackBarBehavior.floating),
      );
    } finally {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  Future<void> _fetchAndStoreProfile() async {
    final baseUrl = const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000',
    );
    final uri = Uri.parse('$baseUrl/api/profile');
    final resp = await _apiClient.getJson(uri);
    if (resp.statusCode == 200 && resp.body.isNotEmpty) {
      try {
        final data = jsonDecode(resp.body) as Map<String, dynamic>;
        final profilePic = data['profilePic'] as String?;
        final prefs = await SharedPreferences.getInstance();
        if (profilePic != null && profilePic.isNotEmpty) {
          await prefs.setString('profilePicUrl', profilePic);
        } else {
          await prefs.remove('profilePicUrl');
        }
      } catch (_) {}
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFF8FBFF), Color(0xFFEFF4FF), Color(0xFFFDFBFF)],
          ),
        ),
        child: Column(
          children: [
            AppNavbar(
              onProfileTap: () {
                Navigator.of(context).pushNamed('/profile-settings');
              },
              onSosTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Please login to use SOS feature'),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
            ),
            Expanded(
              child: SafeArea(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                  child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 500),
                            child: _AuthCard(),
                          ),
                          const SizedBox(height: 24),
                          const FooterSection(),
                        ],
                      ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _authModeToggle() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Expanded(
            child: _SegmentButton(
              label: 'Login',
              selected: _mode == AuthMode.login,
              onTap: () => _setMode(AuthMode.login),
            ),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: _SegmentButton(
              label: 'Signup',
              selected: _mode == AuthMode.signup,
              onTap: () => _setMode(AuthMode.signup),
            ),
          ),
        ],
      ),
    );
  }

  Widget _roleSelector() {
    final roles = <String>['patient', 'doctor'];
    if (_mode == AuthMode.login) {
      roles.add('admin');
    }

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: roles
            .map(
              (role) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: Material(
                    color: _role == role ? Colors.white : Colors.transparent,
                    borderRadius: BorderRadius.circular(6),
                    child: InkWell(
                      onTap: () => setState(() => _role = role),
                      borderRadius: BorderRadius.circular(6),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        alignment: Alignment.center,
                        child: Text(
                          role[0].toUpperCase() + role.substring(1),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: _role == role ? FontWeight.w600 : FontWeight.w400,
                            color: _role == role
                                ? const Color(0xFF3D3E52)
                                : const Color(0xFF8C8D9E),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _authField({
    required String label,
    required String hint,
    required TextEditingController controller,
    required String? Function(String?) validator,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w400,
            color: Color(0xFF3D3E52),
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          validator: validator,
          keyboardType: keyboardType,
          obscureText: obscureText,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(
              color: Color(0xFFBBBCC7),
              fontSize: 14,
            ),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFBBBCC7)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFBBBCC7)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: Color(0xFF4F5085),
                width: 1.5,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFF72B25)),
            ),
          ),
          style: const TextStyle(
            fontSize: 14,
            color: Color(0xFF3D3E52),
          ),
        ),
      ],
    );
  }

  Widget _AuthCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Support Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFFDD5D3),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Color(0xFFF72B25), size: 16),
                  const SizedBox(width: 8),
                  const Text(
                    'Immediate Support',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w400,
                      color: Color(0xFFF72B25),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            // Header
            Text(
              _mode == AuthMode.login ? 'Welcome Back' : 'Create Account',
              style: const TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w600,
                color: Color(0xFF3D3E52),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _mode == AuthMode.login
                  ? 'Welcome back! Please enter your details.'
                  : 'Start with your account details. You can complete your health profile next.',
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF8C8D9E),
              ),
            ),
            const SizedBox(height: 24),
            
            // Role Selector
            _roleSelector(),
            const SizedBox(height: 20),
            
            // Form Fields
            if (_mode == AuthMode.signup) ...[
              _authField(
                label: 'Full Name',
                hint: 'Enter your full name',
                controller: _nameController,
                validator: _validateName,
              ),
              const SizedBox(height: 12),
            ],
            _authField(
              label: 'Email Address',
              hint: 'Enter your email',
              controller: _emailController,
              validator: _validateEmail,
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 12),
            _authField(
              label: 'Password',
              hint: 'At least 8 characters',
              controller: _passwordController,
              validator: _validatePassword,
              obscureText: true,
            ),
            const SizedBox(height: 16),
            
            // Remember Me & Forgot Password
            Row(
              children: [
                Checkbox(
                  value: _rememberMe,
                  onChanged: (value) {
                    setState(() {
                      _rememberMe = value ?? false;
                    });
                  },
                ),
                const Text(
                  'Remember for 30 days',
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF3D3E52),
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Password reset is not connected yet.'),
                      ),
                    );
                  },
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: const Size(0, 0),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text(
                    'Forgot Password?',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF88588D),
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            
            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2E2F6B),
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: const Color(0xFFDBDBE2),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(
                  _isSubmitting
                      ? 'Please wait...'
                      : _mode == AuthMode.login
                      ? 'Sign In'
                      : 'Create Account',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            
            // Toggle Mode
            Center(
              child: TextButton(
                onPressed: () {
                  _setMode(
                    _mode == AuthMode.login ? AuthMode.signup : AuthMode.login,
                  );
                },
                child: Text(
                  _mode == AuthMode.login
                      ? 'Need an account? Sign up'
                      : 'Already have an account? Sign in',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF88588D),
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AuthPromoPanel extends StatelessWidget {
  const _AuthPromoPanel({required this.mode});

  final AuthMode mode;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(32),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0F172A), Color(0xFF2E2F6B), Color(0xFF0F766E)],
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned.fill(
            child: Opacity(
              opacity: 0.16,
              child: Image.asset('assets/images/Shape.png', fit: BoxFit.cover),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Image.asset(
                      'assets/logo/logolight.png',
                      width: 120,
                      fit: BoxFit.contain,
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        mode == AuthMode.login
                            ? 'Secure Login'
                            : 'Create Account',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                const Text(
                  'Support that feels true to you',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 40,
                    height: 1.05,
                    fontWeight: FontWeight.w200,
                    letterSpacing: -1.2,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  mode == AuthMode.login
                      ? 'Use the frontend form to preview your sign-in experience before connecting the backend.'
                      : 'Preview the signup experience with patient, doctor, and admin role selection.',
                  style: const TextStyle(
                    color: Color(0xFFE2E8F0),
                    fontSize: 16,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: const [
                    _PromoStat(label: 'Private'),
                    SizedBox(width: 12),
                    _PromoStat(label: 'Fast'),
                    SizedBox(width: 12),
                    _PromoStat(label: 'Mobile-ready'),
                  ],
                ),
                const SizedBox(height: 24),
                Align(
                  alignment: Alignment.bottomRight,
                  child: Image.asset(
                    'assets/persons/Dp1.png',
                    width: 160,
                    height: 160,
                    fit: BoxFit.cover,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PromoStat extends StatelessWidget {
  const _PromoStat({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withOpacity(0.12)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _SegmentButton extends StatelessWidget {
  const _SegmentButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? Colors.white : Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              color: selected
                  ? const Color(0xFF0F172A)
                  : const Color(0xFF64748B),
              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }
}
