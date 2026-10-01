import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../components/Footer.dart';
import '../components/Navbar.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({Key? key}) : super(key: key);

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final _apiClient = ApiClient();
  
  int _currentStep = 0;
  bool _isLoading = false;
  bool _isSaving = false;
  String _errorMessage = '';

  // Form data
  late TextEditingController _nameController;
  late TextEditingController _ageController;
  late TextEditingController _genderController;
  late TextEditingController _contextController;
  late TextEditingController _guardianNameController;
  late TextEditingController _guardianEmailController;
  late TextEditingController _guardianPhoneController;
  bool _consentAccepted = false;

  final List<String> _steps = [
    'Basic info',
    'How you\'ve been feeling',
    'Emergency contact',
    'Consent',
  ];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _ageController = TextEditingController();
    _genderController = TextEditingController();
    _contextController = TextEditingController();
    _guardianNameController = TextEditingController();
    _guardianEmailController = TextEditingController();
    _guardianPhoneController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ageController.dispose();
    _genderController.dispose();
    _contextController.dispose();
    _guardianNameController.dispose();
    _guardianEmailController.dispose();
    _guardianPhoneController.dispose();
    super.dispose();
  }

  void _nextStep() {
    _errorMessage = '';

    // Validate current step
    if (_currentStep == 0) {
      if (_nameController.text.trim().isEmpty || 
          _ageController.text.trim().isEmpty || 
          _genderController.text.trim().isEmpty) {
        setState(() => _errorMessage = 'Please complete your basic details before moving on.');
        return;
      }
    }

    if (_currentStep == 2) {
      if (_guardianEmailController.text.trim().isEmpty && 
          _guardianPhoneController.text.trim().isEmpty) {
        setState(() => _errorMessage = 'Please add at least a guardian email or phone number.');
        return;
      }
    }

    setState(() => _currentStep = (_currentStep + 1).clamp(0, _steps.length - 1));
  }

  void _previousStep() {
    setState(() {
      _errorMessage = '';
      _currentStep = (_currentStep - 1).clamp(0, _steps.length - 1);
    });
  }

  Future<void> _handleFinish() async {
    _errorMessage = '';

    if (!_consentAccepted) {
      setState(() => _errorMessage = 'Please review and accept the consent note to continue.');
      return;
    }

    setState(() => _isSaving = true);

    try {
      // Save onboarding data
      await _apiClient.putPath(
        '/api/profile',
        body: {
          'name': _nameController.text.trim(),
          'age': int.tryParse(_ageController.text) ?? 0,
          'gender': _genderController.text.trim(),
          'mentalHealthContext': _contextController.text.trim(),
          'guardianName': _guardianNameController.text.trim(),
          'guardianEmail': _guardianEmailController.text.trim(),
          'guardianPhone': _guardianPhoneController.text.trim(),
          'onboardingCompleted': true,
        },
      );

      if (mounted) {
        Navigator.of(context).pushNamedAndRemoveUntil('/patient-dashboard', (route) => false);
      }
    } catch (e) {
      setState(() => _errorMessage = 'Failed to save onboarding: ${e.toString()}');
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          AppNavbar(
            onProfileTap: () {
              Navigator.of(context).pushNamed('/profile-settings');
            },
            onSosTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Please complete onboarding first'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),
          Expanded(
            child: SafeArea(
              child: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      Text(
                        'Patient onboarding',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                          color: Colors.grey[600],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Let\'s make your support space feel a little more personal.',
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'This short setup helps us guide you toward the right features without using clinical or diagnostic language.',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                          height: 1.6,
                        ),
                      ),
                      const SizedBox(height: 32),

                // Step Progress Indicator
                Row(
                  children: List.generate(
                    _steps.length,
                    (index) => Expanded(
                      child: Column(
                        children: [
                          Container(
                            height: 40,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: index <= _currentStep
                                  ? const Color.fromARGB(255, 14, 126, 16)
                                  : Colors.grey[300],
                            ),
                            child: Center(
                              child: Text(
                                '${index + 1}',
                                style: TextStyle(
                                  color: index <= _currentStep
                                      ? Colors.white
                                      : Colors.grey[600],
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _steps[index],
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: index <= _currentStep
                                  ? const Color(0xFF0369A1)
                                  : Colors.grey[500],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 40),

                // Step Content
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey[200]!),
                    borderRadius: BorderRadius.circular(24),
                    color: Colors.white,
                  ),
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Step 0: Basic Info
                      if (_currentStep == 0) ...[
                        Text(
                          'Basic info',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'A few basics help us address you warmly and tailor the experience to you.',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                            height: 1.6,
                          ),
                        ),
                        const SizedBox(height: 24),
                        _buildTextField('Name', _nameController, 'What should we call you?'),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField('Age', _ageController, 'Your age',
                                  keyboardType: TextInputType.number),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildGenderDropdown(),
                            ),
                          ],
                        ),
                      ],

                      // Step 1: Mental Health Context
                      if (_currentStep == 1) ...[
                        Text(
                          'A little context',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'If you want, share what has felt most important lately. This is optional and you can keep it light.',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                            height: 1.6,
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'What would you like us to know?',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _contextController,
                          maxLines: 5,
                          decoration: InputDecoration(
                            hintText:
                                'Examples: feeling more stressed than usual, trouble winding down at night, wanting better routines...',
                            hintStyle: TextStyle(color: Colors.grey[400]),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.grey[300]!),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.grey[300]!),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                  color: Color(0xFF0369A1), width: 2),
                            ),
                            contentPadding: const EdgeInsets.all(12),
                          ),
                        ),
                      ],

                      // Step 2: Emergency Contact
                      if (_currentStep == 2) ...[
                        Text(
                          'Emergency contact',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'This helps us support you quickly if you use the SOS feature.',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                            height: 1.6,
                          ),
                        ),
                        const SizedBox(height: 24),
                        _buildTextField('Guardian or trusted person', _guardianNameController,
                            'Their name'),
                        const SizedBox(height: 16),
                        _buildTextField('Email', _guardianEmailController,
                            'contact@example.com',
                            keyboardType: TextInputType.emailAddress),
                        const SizedBox(height: 16),
                        _buildTextField('Phone', _guardianPhoneController, '+94 7x xxx xxxx'),
                      ],

                      // Step 3: Consent
                      if (_currentStep == 3) ...[
                        Text(
                          'Consent and care note',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'MindBridge offers supportive tools, not medical diagnosis. If you feel at immediate risk, please contact emergency services or a trusted person right away.',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                            height: 1.6,
                          ),
                        ),
                        const SizedBox(height: 24),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.grey[50],
                            borderRadius: BorderRadius.circular(16),
                          ),
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Checkbox(
                                value: _consentAccepted,
                                onChanged: (value) {
                                  setState(() => _consentAccepted = value ?? false);
                                },
                              ),
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.only(top: 2),
                                  child: Text(
                                    'I understand MindBridge is a support platform, not a substitute for emergency care or a clinical diagnosis, and I consent to storing my onboarding details to personalize my experience.',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      height: 1.6,
                                      color: Color(0xFF1E293B),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                        Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0FDF4),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'What comes next',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.5,
                                  color: Color(0xFF166534),
                                ),
                              ),
                              const SizedBox(height: 12),
                              ...[
                                'Use AI Chat for structured, supportive reflection.',
                                'Take a short assessment to see which next step may help most.',
                                'Explore calming activities you can start right away.',
                                'Reach out to a doctor or use SOS if you need more urgent support.',
                              ]
                                  .map(
                                    (text) => Padding(
                                      padding: const EdgeInsets.only(bottom: 8),
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            '• ',
                                            style: TextStyle(
                                              fontSize: 14,
                                              color: Colors.grey[600],
                                            ),
                                          ),
                                          Expanded(
                                            child: Text(
                                              text,
                                              style: TextStyle(
                                                fontSize: 14,
                                                color: Colors.grey[700],
                                                height: 1.5,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  )
                                  .toList(),
                            ],
                          ),
                        ),
                      ],

                      // Error Message
                      if (_errorMessage.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEE2E2),
                            border: Border.all(color: const Color(0xFFFECACA)),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _errorMessage,
                            style: const TextStyle(
                              color: Color(0xDCB91C1C),
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Buttons
                Row(
                  children: [
                    if (_currentStep > 0)
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _previousStep,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: const Color(0xFF1E293B),
                            side: BorderSide(color: Colors.grey[300]!),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            'Back',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                    if (_currentStep > 0) const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed:
                            _isSaving ? null : (_currentStep < _steps.length - 1 ? _nextStep : _handleFinish),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0369A1),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          _isSaving
                              ? 'Saving...'
                              : (_currentStep < _steps.length - 1 ? 'Continue' : 'Finish onboarding'),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ],
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
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller,
    String placeholder, {
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: TextStyle(color: Colors.grey[400]),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF0369A1), width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
        ),
      ],
    );
  }

  Widget _buildGenderDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Gender',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: _genderController.text.isEmpty ? null : _genderController.text,
          hint: const Text('Select one'),
          items: const [
            DropdownMenuItem(value: 'Male', child: Text('Male')),
            DropdownMenuItem(value: 'Female', child: Text('Female')),
            DropdownMenuItem(value: 'Non-binary', child: Text('Non-binary')),
            DropdownMenuItem(
                value: 'Prefer not to say', child: Text('Prefer not to say')),
          ],
          onChanged: (value) {
            setState(() => _genderController.text = value ?? '');
          },
          decoration: InputDecoration(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF166534), width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
        ),
      ],
    );
  }
}
