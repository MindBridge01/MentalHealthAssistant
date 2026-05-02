import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_client.dart';
import '../components/Footer.dart';
import '../components/Navbar.dart';
import 'package:http_parser/http_parser.dart';

class ProfileSettingsPage extends StatefulWidget {
  final bool isOnboarding;

  const ProfileSettingsPage({
    Key? key,
    this.isOnboarding = true,
  }) : super(key: key);

  @override
  State<ProfileSettingsPage> createState() => _ProfileSettingsPageState();
}

class _ProfileSettingsPageState extends State<ProfileSettingsPage> {
  final _apiClient = ApiClient();
  final ImagePicker _imagePicker = ImagePicker();

  // Form controllers
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _birthdayController;
  late TextEditingController _ageController;
  late TextEditingController _phoneController;
  late TextEditingController _addressController;
  late TextEditingController _zipCodeController;
  late TextEditingController _countryController;
  late TextEditingController _cityController;
  late TextEditingController _guardianNameController;
  late TextEditingController _guardianPhoneController;
  late TextEditingController _guardianEmailController;
  late TextEditingController _illnessesController;

  String? _profilePicUrl;
  String _selectedGender = '';
  bool _uploading = false;
  bool _saving = false;
  String _errorMessage = '';
  String _successMessage = '';

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _birthdayController = TextEditingController();
    _ageController = TextEditingController();
    _phoneController = TextEditingController();
    _addressController = TextEditingController();
    _zipCodeController = TextEditingController();
    _countryController = TextEditingController();
    _cityController = TextEditingController();
    _guardianNameController = TextEditingController();
    _guardianPhoneController = TextEditingController();
    _guardianEmailController = TextEditingController();
    _illnessesController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _birthdayController.dispose();
    _ageController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _zipCodeController.dispose();
    _countryController.dispose();
    _cityController.dispose();
    _guardianNameController.dispose();
    _guardianPhoneController.dispose();
    _guardianEmailController.dispose();
    _illnessesController.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadImage() async {
    try {
      final XFile? pickedFile = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 80,
      );

      if (pickedFile == null) return;

      setState(() => _uploading = true);
      _errorMessage = '';

      // Upload to Cloudinary
      final cloudName = 'drwpr138z';
      final uploadPreset = 'Mind_Bridge';

      final request = http.MultipartRequest(
        'POST',
        Uri.parse(
          'https://api.cloudinary.com/v1_1/$cloudName/image/upload',
        ),
      );

            request.fields['upload_preset'] = uploadPreset;
      
      // Read file bytes without dart:io dependency
      final bytes = await pickedFile.readAsBytes();
      
      request.files.add(
        http.MultipartFile.fromBytes(
          'file',
          bytes,
          filename: pickedFile.name,
          contentType: MediaType('image', 'jpeg'),
        ),
      );

      final response = await request.send();
      final responseData = await response.stream.bytesToString();

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(responseData);
        setState(() {
          _profilePicUrl = jsonResponse['secure_url'];
        });
        try {
          final prefs = await SharedPreferences.getInstance();
          if (_profilePicUrl != null && _profilePicUrl!.isNotEmpty) {
            await prefs.setString('profilePicUrl', _profilePicUrl!);
          }
        } catch (_) {}
      } else {
        setState(() {
          _errorMessage = 'Image upload failed. Please try again.';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Image upload failed: ${e.toString()}';
      });
    } finally {
      setState(() => _uploading = false);
    }
  }

  String? _validateForm() {
    if (_nameController.text.trim().isEmpty) return 'Full name is required.';
    if (!_isValidEmail(_emailController.text.trim())) return 'Please enter a valid email address.';
    if (_birthdayController.text.isEmpty) return 'Date of birth is required.';
    if (_ageController.text.trim().isEmpty) return 'Age is required.';
    if (_selectedGender.isEmpty) return 'Please select gender.';
    if (_phoneController.text.trim().isEmpty) return 'Phone number is required.';
    if (_addressController.text.trim().isEmpty) return 'Address is required.';
    if (_zipCodeController.text.trim().isEmpty) return 'Zip code is required.';
    if (_countryController.text.trim().isEmpty) return 'Country is required.';
    if (_cityController.text.trim().isEmpty) return 'City is required.';
    if (_guardianNameController.text.trim().isEmpty) return 'Guardian name is required.';
    if (_guardianPhoneController.text.trim().isEmpty) return 'Guardian phone number is required.';
    if (!_isValidEmail(_guardianEmailController.text.trim())) return 'Please enter a valid guardian email address.';
    if (_illnessesController.text.trim().isEmpty) return 'Medical context is required.';
    return null;
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email);
  }

  Future<void> _handleSave() async {
    _errorMessage = '';
    _successMessage = '';

    final validationError = _validateForm();
    if (validationError != null) {
      setState(() => _errorMessage = validationError);
      return;
    }

    setState(() => _saving = true);

    try {
      await _apiClient.putPath(
        '/api/profile',
        body: {
          'name': _nameController.text.trim(),
          'email': _emailController.text.trim().toLowerCase(),
          'profilePic': _profilePicUrl,
          'birthday': _birthdayController.text,
          'age': int.tryParse(_ageController.text) ?? 0,
          'gender': _selectedGender,
          'phone': _phoneController.text.trim(),
          'address': _addressController.text.trim(),
          'zipcode': _zipCodeController.text.trim(),
          'country': _countryController.text.trim(),
          'city': _cityController.text.trim(),
          'guardianName': _guardianNameController.text.trim(),
          'guardianPhone': _guardianPhoneController.text.trim(),
          'guardianEmail': _guardianEmailController.text.trim().toLowerCase(),
          'illnesses': _illnessesController.text.trim(),
        },
      );

      setState(() {
        _successMessage = widget.isOnboarding
            ? 'Welcome. Your profile is complete.'
            : 'Profile updated successfully.';
      });

      if (widget.isOnboarding) {
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            Navigator.of(context).pushNamedAndRemoveUntil(
              '/home',
              (route) => false,
            );
          }
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Profile update failed: ${e.toString()}';
      });
    } finally {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.isOnboarding ? 'Complete Your Care Profile' : 'Profile Settings',
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
      ),
      body: Column(
        children: [
                    AppNavbar(
            profilePicUrl: _profilePicUrl,
            onProfileTap: () {
              Navigator.of(context).pushNamed('/profile-settings');
            },
            onSosTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('SOS help triggered'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                child: Column(
                  children: [
                    // Subtitle
                    Text(
                      'Keep your information accurate so your care team and emergency contacts can support you.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey[600], fontSize: 14),
                    ),
                    const SizedBox(height: 24),

                    // Profile Picture Section
              Center(
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 56,
                        backgroundImage: _profilePicUrl != null
                          ? NetworkImage(_profilePicUrl!)
                          : const AssetImage('assets/images/post1.jpg') as ImageProvider,
                      backgroundColor: Colors.grey[200],
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _uploading ? null : _pickAndUploadImage,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF0F9FF),
                        foregroundColor: const Color(0xFF0369A1),
                        side: const BorderSide(color: Color(0xFFE0F2FE)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                      child: Text(
                        _uploading ? 'Uploading...' : 'Change Photo',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Error Message
              if (_errorMessage.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    border: Border.all(color: const Color(0xFFFECACA)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _errorMessage,
                    style: const TextStyle(color: Color(0xDCB91C1C), fontSize: 14),
                  ),
                ),

              // Success Message
              if (_successMessage.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0FDF4),
                    border: Border.all(color: const Color(0xFFA7F3D0)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _successMessage,
                    style: const TextStyle(color: Color(0xFF0369A1), fontSize: 14),
                  ),
                ),

              // Personal Details Section
              _buildSection(
                'Personal Details',
                [
                  _buildTextField('Full Name', _nameController),
                  _buildTextField('Email', _emailController, keyboardType: TextInputType.emailAddress),
                  _buildDateField('Birthday', _birthdayController),
                  _buildTextField('Age', _ageController, keyboardType: TextInputType.number),
                  _buildGenderDropdown(),
                  _buildTextField('Phone Number', _phoneController),
                ],
              ),
              const SizedBox(height: 24),

              // Location Section
              _buildSection(
                'Location',
                [
                  _buildTextField('Address', _addressController, fullWidth: true),
                  _buildTextField('City', _cityController),
                  _buildTextField('Zipcode', _zipCodeController),
                  _buildTextField('Country', _countryController, fullWidth: true),
                ],
              ),
              const SizedBox(height: 24),

              // Guardian Contact Section
              _buildSection(
                'Guardian Contact',
                [
                  _buildTextField('Guardian Name', _guardianNameController, fullWidth: true),
                  _buildTextField('Guardian Phone Number', _guardianPhoneController),
                  _buildTextField('Guardian Email', _guardianEmailController),
                ],
              ),
              const SizedBox(height: 24),

              // Medical Context Section
              _buildSection(
                'Medical Context',
                [
                  _buildTextArea('Current illnesses, history, or notes', _illnessesController),
                ],
              ),
              const SizedBox(height: 32),

              // Save Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: (_uploading || _saving) ? null : _handleSave,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0369A1),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    disabledBackgroundColor: Colors.grey[400],
                  ),
                  child: Text(
                    _saving ? 'Saving...' : 'Save Profile',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const FooterSection(),
                    ],
                  ),
                ),
              ),
            ),
          
        ],
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> fields) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                height: 1,
                color: Colors.grey[300],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: fields,
        ),
      ],
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller, {
    TextInputType keyboardType = TextInputType.text,
    bool fullWidth = false,
  }) {
    return SizedBox(
      width: fullWidth ? double.infinity : (MediaQuery.of(context).size.width - 40) / 2,
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          hintText: label,
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
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
        ),
      ),
    );
  }

  Widget _buildDateField(String label, TextEditingController controller) {
    return SizedBox(
      width: (MediaQuery.of(context).size.width - 40) / 2,
      child: GestureDetector(
        onTap: () async {
          final picked = await showDatePicker(
            context: context,
            initialDate: DateTime.now(),
            firstDate: DateTime(1950),
            lastDate: DateTime.now(),
          );
          if (picked != null) {
            controller.text = picked.toString().split(' ')[0];
          }
        },
        child: AbsorbPointer(
          child: TextField(
            controller: controller,
            decoration: InputDecoration(
              hintText: label,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
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
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGenderDropdown() {
    return SizedBox(
      width: (MediaQuery.of(context).size.width - 40) / 2,
      child: DropdownButtonFormField<String>(
        value: _selectedGender.isEmpty ? null : _selectedGender,
        hint: const Text('Select Gender'),
        items: const [
          DropdownMenuItem(value: 'Male', child: Text('Male')),
          DropdownMenuItem(value: 'Female', child: Text('Female')),
        ],
        onChanged: (value) {
          setState(() => _selectedGender = value ?? '');
        },
        decoration: InputDecoration(
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
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
        ),
      ),
    );
  }

  Widget _buildTextArea(String label, TextEditingController controller) {
    return SizedBox(
      width: double.infinity,
      child: TextField(
        controller: controller,
        maxLines: 5,
        decoration: InputDecoration(
          hintText: label,
          contentPadding: const EdgeInsets.all(12),
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
        ),
      ),
    );
  }
}
